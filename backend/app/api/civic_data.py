"""
Civic Data API — Timeline, EVM data, and voter quiz endpoints.

Serves structured civic data about Indian elections to the frontend.
All data sourced from ECI (Election Commission of India) official publications.
"""
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter()


@router.get("/timeline")
async def get_timeline() -> Dict[str, Any]:
    """Return the full 2024 Lok Sabha election timeline with all 7 phases and key stats."""
    return {
        "election": "18th Lok Sabha General Election 2024",
        "current_phase": "Post-Election",
        "status": "Results declared June 4, 2024",
        "phases": [
            {"number": 1, "name": "Notification & Nomination", "phase": "Phase 0", "date": "March 20, 2024", "description": "ECI issues election notification. Candidates file nominations with Returning Officers.", "colour": "#3B82F6", "icon": "📜", "seats": 0, "states": 0, "turnout": "N/A", "key_constituencies": ["National"]},
            {"number": 2, "name": "Scrutiny & Withdrawal", "phase": "Preparation", "date": "March 28 – April 2, 2024", "description": "Nominations scrutinised. Candidates may withdraw till 3 PM on withdrawal date.", "colour": "#F59E0B", "icon": "🔍", "seats": 0, "states": 0, "turnout": "N/A", "key_constituencies": ["National"]},
            {"number": 3, "name": "Phase 1 Polling", "phase": "Phase 1", "date": "April 19, 2024", "description": "102 constituencies in 21 states/UTs vote. Includes Arunachal Pradesh and Sikkim assembly elections.", "colour": "#10B981", "icon": "🗳️", "seats": 102, "states": 21, "turnout": "66.1%", "key_constituencies": ["Coimbatore", "Nagaland", "Arunachal Pradesh"]},
            {"number": 4, "name": "Phase 2 Polling", "phase": "Phase 2", "date": "April 26, 2024", "description": "89 constituencies in 13 states/UTs vote.", "colour": "#10B981", "icon": "🗳️", "seats": 89, "states": 13, "turnout": "66.7%", "key_constituencies": ["Manipur", "Kerala", "Rajasthan"]},
            {"number": 5, "name": "Phase 3 Polling", "phase": "Phase 3", "date": "May 7, 2024", "description": "94 constituencies in 12 states/UTs vote.", "colour": "#10B981", "icon": "🗳️", "seats": 94, "states": 12, "turnout": "65.7%", "key_constituencies": ["Surat", "Banswara", "Sambhal"]},
            {"number": 6, "name": "Phase 4 Polling", "phase": "Phase 4", "date": "May 13, 2024", "description": "96 constituencies in 10 states/UTs vote.", "colour": "#10B981", "icon": "🗳️", "seats": 96, "states": 10, "turnout": "69.2%", "key_constituencies": ["Hyderabad", "Jammu", "Srinagar"]},
            {"number": 7, "name": "Phase 5 Polling", "phase": "Phase 5", "date": "May 20, 2024", "description": "49 constituencies in 8 states/UTs vote.", "colour": "#10B981", "icon": "🗳️", "seats": 49, "states": 8, "turnout": "62.2%", "key_constituencies": ["Lucknow", "Rae Bareli", "Amethi"]},
            {"number": 8, "name": "Phase 6 Polling", "phase": "Phase 6", "date": "May 25, 2024", "description": "58 constituencies in 7 states/UTs vote.", "colour": "#10B981", "icon": "🗳️", "seats": 58, "states": 7, "turnout": "63.4%", "key_constituencies": ["Varanasi", "Delhi North", "Sahibabad"]},
            {"number": 9, "name": "Phase 7 Polling", "phase": "Phase 7", "date": "June 1, 2024", "description": "57 constituencies in 8 states/UTs vote. Final phase of polling.", "colour": "#10B981", "icon": "🗳️", "seats": 57, "states": 8, "turnout": "62.2%", "key_constituencies": ["Patna Sahib", "Nalanda", "Chandigarh"]},
            {"number": 10, "name": "Vote Counting & Results", "phase": "Results", "date": "June 4, 2024", "description": "All EVMs opened simultaneously. NDA wins 293 seats; INDIA wins 233 seats. Narendra Modi sworn in as PM for third term on June 9.", "colour": "#8B5CF6", "icon": "🏆", "seats": 543, "states": 36, "turnout": "66.3%", "key_constituencies": ["All 543 constituencies"], "isResult": True},
        ],
        "key_stats": {
            "total_voters": "968.8 million",
            "votes_cast": "642 million",
            "turnout": "66.3%",
            "constituencies": 543,
            "candidates": 8360,
            "polling_stations": "1.04 million",
        },
    }


@router.get("/evm-data")
async def get_evm_data() -> Dict[str, Any]:
    """Return EVM simulator data for the Varanasi constituency."""
    return {
        "constituency": "Varanasi (UP-72)",
        "election": "Lok Sabha 2024",
        "total_voters": 1811300,
        "evm_model": "M3 (2020)",
        "candidates": [
            {"id": 1, "name": "Narendra Modi", "party": "Bharatiya Janata Party", "symbol": "🪷", "serial": 1, "colour": "#FF6B35"},
            {"id": 2, "name": "Ajay Rai", "party": "Indian National Congress", "symbol": "✋", "serial": 2, "colour": "#1E40AF"},
            {"id": 3, "name": "Sanjay Chauhan", "party": "Bahujan Samaj Party", "symbol": "🐘", "serial": 3, "colour": "#1E3A8A"},
            {"id": 4, "name": "Athar Jamal Lari", "party": "All India Majlis-e-Ittehadul Muslimeen", "symbol": "🕌", "serial": 4, "colour": "#065F46"},
            {"id": 5, "name": "NOTA", "party": "None Of The Above", "symbol": "❌", "serial": 5, "colour": "#6B7280"},
        ],
        "evm_facts": [
            "This EVM has no WiFi, Bluetooth, or internet connection",
            "Your vote is encrypted and cannot be traced back to you",
            "The VVPAT slip will be visible for 7 seconds to confirm your vote",
            "The indelible ink ensures you can only vote once",
        ],
    }


@router.get("/quiz")
async def get_quiz() -> Dict[str, Any]:
    """Return a set of civic awareness quiz questions with answers and explanations."""
    return {
        "title": "Voter Awareness Quiz",
        "description": "Test your knowledge about Indian elections and democracy",
        "questions": [
            {
                "id": 1,
                "question": "What does EVM stand for?",
                "options": ["Electronic Voting Machine", "Electoral Verification Module", "Election Vote Manager", "Electronic Vote Monitor"],
                "correct": 0,
                "explanation": "EVM stands for Electronic Voting Machine. It consists of two parts: the Control Unit and the Balloting Unit.",
                "source": "ECI Technical Manual",
            },
            {
                "id": 2,
                "question": "How many Lok Sabha seats are there in India?",
                "options": ["500", "543", "545", "552"],
                "correct": 1,
                "explanation": "The Lok Sabha has 543 constituencies. A party needs 272 seats for a simple majority.",
                "source": "Constitution of India, Article 81",
            },
            {
                "id": 3,
                "question": "What is the minimum voting age in India?",
                "options": ["16 years", "18 years", "21 years", "25 years"],
                "correct": 1,
                "explanation": "The voting age was lowered from 21 to 18 by the 61st Constitutional Amendment Act, 1988.",
                "source": "61st Constitutional Amendment 1988",
            },
            {
                "id": 4,
                "question": "What does NOTA stand for?",
                "options": ["Not On The Agenda", "None Of The Above", "No Other Than Applicable", "National Option for Transparent Accountability"],
                "correct": 1,
                "explanation": "NOTA was introduced following the Supreme Court order in PUCL vs Union of India (2013).",
                "source": "Supreme Court Order 2013",
            },
            {
                "id": 5,
                "question": "When was the first general election in India held?",
                "options": ["1947-48", "1949-50", "1951-52", "1955-56"],
                "correct": 2,
                "explanation": "India's first general election was held from October 1951 to February 1952. Nehru's Congress won 364 of 489 seats.",
                "source": "ECI Historical Records",
            },
        ],
    }
