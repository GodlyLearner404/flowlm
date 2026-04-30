import json
from sentence_transformers import SentenceTransformer, util

model = None


def get_model():
    global model
    if model is None:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model

class SimpleEvaluator:

    @staticmethod
    def score(output: str, expected: str):
        if not expected:
            return None
        
        evaluator_model = get_model()
        emb_expected = evaluator_model.encode(expected, convert_to_tensor=True)
        emb_actual = evaluator_model.encode(output, convert_to_tensor=True)
        similarity = util.cos_sim(emb_expected, emb_actual).item()

        # output = output.lower()
        # expected = expected.lower()

        return 1


# 1. Setup the Evaluation Model
# This model converts sentences into vectors to calculate "meaning" similarity

# def score(dataset: str, llm_outputs: str):
#     """
#     Evaluates LLM outputs based on semantic similarity and word count constraints.
#     """
#     results = []
    
#     for i, entry in enumerate(dataset):
#         topic = entry['input']['topic']
#         expected = entry['expected']
#         actual = llm_outputs[i] # Assuming outputs match dataset order
        
#         # --- Metric 1: Word Count Check ---
#         # Goal: 5 - 10 words
#         word_count = len(actual.split())
#         is_length_valid = 5 <= word_count <= 10
        
#         # --- Metric 2: Semantic Similarity ---
#         # Converts both strings to embeddings and calculates Cosine Similarity
#         emb_expected = model.encode(expected, convert_to_tensor=True)
#         emb_actual = model.encode(actual, convert_to_tensor=True)
#         similarity = util.cos_sim(emb_expected, emb_actual).item()
        
#         # --- Final Scoring Logic ---
#         # A 'Pass' requires high similarity (>0.7) AND correct length
#         passed = similarity > 0.7 and is_length_valid
        
#         results.append({
#             "topic": topic,
#             "actual": actual,
#             "similarity": round(similarity, 3),
#             "word_count": word_count,
#             "status": "✅ PASS" if passed else "❌ FAIL"
#         })
        
#     return results

# # --- Example Usage ---

# # Your input dataset
# eval_dataset = [
#     {"input": {"topic": "Entropy"}, "expected": "A measure of disorder or randomness within a closed system."},
#     {"input": {"topic": "Oxymoron"}, "expected": "A figure of speech combining two seemingly contradictory terms."},
#     {"input": {"topic": "Archipelago"}, "expected": "A group or chain of islands clustered in a sea."}
# ]

# # Mocked outputs from your LLM project
# mock_llm_results = [
#     "A measure of randomness or disorder in a system.",        # Pass: Good meaning, 9 words
#     "Words that are opposite like bitter sweet or jumbo shrimp.", # Fail: Too many words (11)
#     "A chain of islands in the ocean."                        # Pass: Good meaning, 7 words
# ]

# # Run the evaluation
# report = evaluate_llm_responses(eval_dataset, mock_llm_results)

# # Display Results
# print(f"{'TOPIC':<15} | {'SIMILARITY':<10} | {'WORDS':<6} | {'STATUS'}")
# print("-" * 55)
# for r in report:
#     print(f"{r['topic']:<15} | {r['similarity']:<10} | {r['word_count']:<6} | {r['status']}")
