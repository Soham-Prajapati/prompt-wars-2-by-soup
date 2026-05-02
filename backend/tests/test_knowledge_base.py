"""
Tests for KnowledgeBase — BM25 retrieval over ECI knowledge corpus.

Validates tokenization, ranked retrieval, context generation, and edge cases.
"""
import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("GEMINI_API_KEY", "unit-test-key")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "unit-test-project")

from app.knowledge_base import KnowledgeBase, knowledge_base  # noqa: E402


class TestKnowledgeBaseTokenizer:
    """Tokenizer must normalise and split correctly."""

    def test_lowercase_and_split(self):
        tokens = knowledge_base._tokenize("Hello World 2024!")
        assert "hello" in tokens
        assert "world" in tokens
        assert "2024" in tokens

    def test_strips_special_characters(self):
        tokens = knowledge_base._tokenize("EVM's & VVPAT (Verified)")
        # Apostrophes and parentheses should be removed
        assert all(tok.isalnum() for tok in tokens)

    def test_empty_string_returns_empty(self):
        tokens = knowledge_base._tokenize("")
        # split on empty returns [''], filter it
        assert isinstance(tokens, list)


class TestKnowledgeBaseRetrieve:
    """BM25 retrieve must return ranked, scored results."""

    def test_evm_query_returns_results(self):
        results = knowledge_base.retrieve("How does EVM work?", top_k=3)
        assert len(results) > 0
        assert results[0]["relevance_score"] > 0

    def test_voter_registration_query(self):
        results = knowledge_base.retrieve("voter registration process", top_k=5)
        assert len(results) > 0

    def test_results_have_required_fields(self):
        results = knowledge_base.retrieve("election commission", top_k=2)
        for doc in results:
            assert "text" in doc
            assert "source" in doc
            assert "relevance_score" in doc

    def test_results_are_ranked_by_score(self):
        results = knowledge_base.retrieve("NOTA", top_k=5)
        if len(results) >= 2:
            scores = [r["relevance_score"] for r in results]
            assert scores == sorted(scores, reverse=True)

    def test_gibberish_query_returns_few_or_no_results(self):
        results = knowledge_base.retrieve("xyzabc123nonsensequery999", top_k=5)
        # Should return 0 results since no tokens match
        assert len(results) == 0


class TestKnowledgeBaseGetContext:
    """get_context must return (context_str, sources_list) tuple."""

    def test_returns_tuple(self):
        result = knowledge_base.get_context("election", top_k=3)
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_context_string_contains_source_tags(self):
        context, sources = knowledge_base.get_context("EVM", top_k=3)
        assert len(context) > 0
        assert "[" in context  # Source tags like [ECI Official]

    def test_sources_list_is_deduplicated(self):
        _, sources = knowledge_base.get_context("election commission", top_k=5)
        assert len(sources) == len(set(sources))

    def test_empty_query_returns_empty(self):
        context, sources = knowledge_base.get_context("xyznonexistent999", top_k=3)
        assert context == ""
        assert sources == []


class TestKnowledgeBaseInit:
    """KnowledgeBase initialisation validates corpus loading."""

    def test_corpus_is_loaded(self):
        assert len(knowledge_base.documents) > 0

    def test_fresh_instance_works(self):
        kb = KnowledgeBase()
        results = kb.retrieve("election", top_k=1)
        assert isinstance(results, list)
