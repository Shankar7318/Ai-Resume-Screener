import numpy as np
from typing import List, Dict, Any
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import ollama
import json

class SemanticSearch:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.candidate_vectors = None
        self.candidates = []
        self.is_fitted = False
    
    def prepare_candidates(self, candidates: List[Dict[str, Any]]):
        """Prepare candidate data for search"""
        self.candidates = candidates
        
        # Create searchable text for each candidate
        search_texts = []
        for c in candidates:
            text = f"""
            Name: {c.get('name', '')}
            Skills: {' '.join(c.get('skills', []))}
            Experience: {c.get('experience_years', 0)} years
            Education: {c.get('education_score', 0)}% match
            Overall Score: {c.get('overall_score', 0)}%
            Reason: {c.get('reason', '')}
            Tags: {' '.join(c.get('tags', []))}
            """.lower()
            search_texts.append(text)
        
        # Vectorize texts
        if search_texts:
            self.candidate_vectors = self.vectorizer.fit_transform(search_texts)
            self.is_fitted = True
    
    def keyword_search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Traditional keyword-based search"""
        if not self.is_fitted or not self.candidates:
            return []
        
        query_vector = self.vectorizer.transform([query.lower()])
        similarities = cosine_similarity(query_vector, self.candidate_vectors).flatten()
        
        # Get top k results
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0:
                results.append({
                    'candidate': self.candidates[idx],
                    'score': float(similarities[idx] * 100)
                })
        
        return results
    
    def semantic_search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """AI-powered semantic search using embeddings"""
        try:
            # Use Ollama to generate query embedding
            response = ollama.embeddings(
                model='mistral:latest',
                prompt=query
            )
            query_embedding = response['embedding']
            
            # Generate embeddings for candidates (simplified - in production use batch processing)
            results = []
            for candidate in self.candidates:
                candidate_text = f"""
                {candidate.get('name', '')} 
                {' '.join(candidate.get('skills', []))} 
                {candidate.get('reason', '')}
                """.lower()
                
                emb_response = ollama.embeddings(
                    model='mistral:latest',
                    prompt=candidate_text[:1000]  # Limit text length
                )
                candidate_embedding = emb_response['embedding']
                
                # Calculate cosine similarity
                similarity = np.dot(query_embedding, candidate_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(candidate_embedding)
                )
                
                results.append({
                    'candidate': candidate,
                    'score': float(similarity * 100)
                })
            
            # Sort by similarity
            results.sort(key=lambda x: x['score'], reverse=True)
            return results[:top_k]
            
        except Exception as e:
            print(f"Error in semantic search: {e}")
            return self.keyword_search(query, top_k)
    
    def hybrid_search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Combine keyword and semantic search"""
        keyword_results = self.keyword_search(query, top_k * 2)
        semantic_results = self.semantic_search(query, top_k * 2)
        
        # Combine and deduplicate
        combined = {}
        
        for r in keyword_results:
            candidate_id = r['candidate'].get('id')
            combined[candidate_id] = {
                'candidate': r['candidate'],
                'keyword_score': r['score'],
                'semantic_score': 0,
                'final_score': r['score'] * 0.3  # 30% weight for keyword
            }
        
        for r in semantic_results:
            candidate_id = r['candidate'].get('id')
            if candidate_id in combined:
                combined[candidate_id]['semantic_score'] = r['score']
                combined[candidate_id]['final_score'] += r['score'] * 0.7  # 70% weight for semantic
            else:
                combined[candidate_id] = {
                    'candidate': r['candidate'],
                    'keyword_score': 0,
                    'semantic_score': r['score'],
                    'final_score': r['score'] * 0.7
                }
        
        # Sort by final score
        results = list(combined.values())
        results.sort(key=lambda x: x['final_score'], reverse=True)
        
        return [{
            'candidate': r['candidate'],
            'score': r['final_score'],
            'keyword_score': r['keyword_score'],
            'semantic_score': r['semantic_score']
        } for r in results[:top_k]]