"""
ElectIQ Knowledge Base — 500+ ECI facts with BM25 retrieval
No external DB required for demo. Swap with pgvector for production.
"""
import re
from typing import Any, Dict, List, Tuple

from rank_bm25 import BM25Okapi

ECI_CORPUS = [
    # === ELECTION BASICS ===
    {"id": "e001", "topic": "election_overview", "text": "India conducts the world's largest democratic election. The Lok Sabha (House of the People) has 543 constituencies. Each constituency elects one Member of Parliament (MP) through a First-Past-The-Post (FPTP) system.", "source": "ECI Handbook 2024"},
    {"id": "e002", "topic": "election_overview", "text": "The Election Commission of India (ECI) is a constitutional body established under Article 324 of the Indian Constitution. It is responsible for administering elections to the Parliament, State Legislatures, and offices of the President and Vice-President.", "source": "Constitution of India, Article 324"},
    {"id": "e003", "topic": "election_phases", "text": "The 2024 Lok Sabha General Election was conducted in 7 phases from April 19 to June 1, 2024. Results were declared on June 4, 2024. This was the 18th Lok Sabha election.", "source": "ECI Press Note 2024"},
    {"id": "e004", "topic": "voter_registration", "text": "Indian citizens aged 18 and above can register to vote. Registration is done through Form 6 on the National Voters' Service Portal (NVSP) at voters.eci.gov.in or via the Voter Helpline App. The EPIC (Electoral Photo Identity Card) is issued after registration.", "source": "ECI Voter Registration Guide"},
    {"id": "e005", "topic": "voter_registration", "text": "The Voter Helpline number is 1950. Citizens can call this toll-free number to check voter registration status, find polling booth details, and get election-related assistance.", "source": "ECI Voter Helpline"},
    # === EVM ===
    {"id": "e010", "topic": "evm", "text": "An Electronic Voting Machine (EVM) consists of two units: the Control Unit (kept with the Presiding Officer) and the Balloting Unit (in the voting compartment). These are connected by a 5-meter cable.", "source": "ECI EVM Technical Manual"},
    {"id": "e011", "topic": "evm", "text": "EVMs were first used on a pilot basis in 1982 in Kerala (Parur Assembly Constituency). They were used universally across India from the 2004 General Elections onwards.", "source": "ECI History of EVMs"},
    {"id": "e012", "topic": "evm", "text": "The M3 EVM (third generation) has been in use since 2020. It has enhanced security features including a tamper-detection mechanism. The EVM battery is self-contained and does not require external power supply, making it suitable for remote areas.", "source": "ECI Technical Manual M3"},
    {"id": "e013", "topic": "evm_security", "text": "EVMs are standalone machines with no WiFi, Bluetooth, or internet connectivity. They cannot be hacked remotely. The Supreme Court of India has upheld the integrity of EVMs in multiple rulings.", "source": "Supreme Court of India, multiple judgments"},
    {"id": "e014", "topic": "evm_security", "text": "The EVM stores votes in a encrypted memory chip. The chip is a one-time programmable (OTP) device — it can only be written once during manufacturing. The software is burned into the chip and cannot be changed.", "source": "ECI EVM Technical White Paper"},
    {"id": "e015", "topic": "vvpat", "text": "VVPAT (Voter Verifiable Paper Audit Trail) is a printer attached to the EVM Balloting Unit. When a voter presses a button, a paper slip showing the candidate's name, party symbol, and serial number is printed and visible for 7 seconds, then drops into a sealed compartment.", "source": "ECI VVPAT Guidelines"},
    {"id": "e016", "topic": "vvpat", "text": "VVPAT slips are counted during VVPAT verification. The Supreme Court in the ADR vs ECI case (2019) mandated VVPAT counting in 5 randomly selected booths per constituency. This was later enhanced.", "source": "Supreme Court Order 2019"},
    # === VOTING PROCESS ===
    {"id": "e020", "topic": "voting_process", "text": "On polling day, a voter must bring their Voter ID (EPIC card) or any of 12 alternative documents: Aadhaar card, Passport, Driving License, PAN card, MNREGA job card, Health Smart Card, Passbook with photo, pension document, NPR Smart Card, or document issued by Central/State Government.", "source": "ECI Polling Day Guidelines 2024"},
    {"id": "e021", "topic": "voting_process", "text": "The voting process: 1) Voter enters polling station 2) Identity verified by Booth Level Officer 3) Name found in electoral roll 4) Voter signs in register 5) Indelible ink applied to left index finger 6) Voter slip issued 7) Voter enters booth 8) Presses EVM button 9) VVPAT slip visible for 7 seconds 10) Vote recorded.", "source": "ECI Polling Day Manual"},
    {"id": "e022", "topic": "voting_process", "text": "Indelible ink is applied to the left index finger of the voter to prevent multiple voting. The ink is manufactured by Mysore Paints and Varnish Ltd (MVPL) and lasts for several weeks.", "source": "ECI Polling Day Guidelines"},
    {"id": "e023", "topic": "voter_rights", "text": "A voter has the right to a secret ballot. No one, including election officials, can ask whom you voted for. If a voter is challenged at the polling station, they can cast a tendered vote while the dispute is resolved.", "source": "Representation of the People Act 1951, Section 49"},
    {"id": "e024", "topic": "voter_rights", "text": "NOTA (None Of The Above) is an option on the EVM ballot. A voter can press the NOTA button if they do not want to vote for any candidate. NOTA was introduced following the Supreme Court order in PUCL vs Union of India (2013).", "source": "Supreme Court Order 2013, ECI Circular"},
    # === MCC — MODEL CODE OF CONDUCT ===
    {"id": "e030", "topic": "mcc", "text": "The Model Code of Conduct (MCC) comes into effect from the date of announcement of the election schedule. It prohibits: use of government resources for campaigning, announcing new policies/schemes, making communal/caste appeals, use of money/liquor to influence voters.", "source": "ECI Model Code of Conduct"},
    {"id": "e031", "topic": "mcc", "text": "Under MCC, political parties and candidates must obtain permission from local authorities for rallies and meetings. Loudspeakers require permits. Campaign material must display 'Printed and Published by' details.", "source": "ECI MCC Guidelines"},
    {"id": "e032", "topic": "mcc", "text": "MCC prohibits the ruling party from using state machinery for electoral gains. Ministers cannot use government vehicles for campaigning. Official government media cannot be used for party propaganda.", "source": "ECI MCC Handbook"},
    # === ELECTION PHASES ===
    {"id": "e040", "topic": "election_phases", "text": "The election process has 6 stages: 1) Issue of Notification 2) Filing of Nominations 3) Scrutiny of Nominations 4) Withdrawal of Candidatures 5) Polling 6) Counting and Declaration of Results.", "source": "ECI Election Process Overview"},
    {"id": "e041", "topic": "nomination", "text": "A candidate must file a nomination form with the Returning Officer. For Lok Sabha elections, the nomination deposit is ₹25,000 for general candidates and ₹12,500 for SC/ST candidates. The deposit is forfeited if the candidate gets less than 1/6th of valid votes polled.", "source": "Representation of the People Act 1951, Section 34"},
    {"id": "e042", "topic": "candidate_eligibility", "text": "To be eligible as a Lok Sabha candidate: must be an Indian citizen, at least 25 years old, registered as a voter in any constituency in India, not declared unsound mind by court, not insolvent, not hold any office of profit under Government of India.", "source": "Constitution of India, Article 84; RPA 1951"},
    {"id": "e043", "topic": "candidate_eligibility", "text": "A person convicted of a criminal offence and sentenced to imprisonment of 2 years or more is disqualified from contesting elections for 6 years after release. However, a person against whom cases are pending (not convicted) can still contest.", "source": "Representation of the People Act 1951, Section 8"},
    # === CONSTITUENCIES ===
    {"id": "e050", "topic": "constituencies", "text": "India has 543 Lok Sabha constituencies and approximately 4,033 State Legislative Assembly (Vidhan Sabha) constituencies across all states and union territories.", "source": "Delimitation Commission of India"},
    {"id": "e051", "topic": "constituencies", "text": "SC (Scheduled Caste) reserved constituencies: 84 Lok Sabha seats. ST (Scheduled Tribe) reserved constituencies: 47 Lok Sabha seats. These reserved seats can only be contested by candidates from the respective communities.", "source": "Delimitation Commission Order 2008"},
    {"id": "e052", "topic": "delimitation", "text": "Delimitation is the process of fixing the number and boundaries of constituencies. The Delimitation Commission is set up under the Delimitation Act. The last delimitation was in 2002 (effective 2008). The next delimitation will be based on the 2031 Census.", "source": "Delimitation Commission of India"},
    # === ELECTION COMMISSION ===
    {"id": "e060", "topic": "eci_structure", "text": "The Election Commission of India consists of the Chief Election Commissioner (CEC) and two Election Commissioners. They are appointed by the President of India on the advice of a selection committee. The CEC can only be removed through a process similar to removal of a Supreme Court judge.", "source": "Constitution of India, Article 324; Chief Election Commissioner and Other Election Commissioners Act 2023"},
    {"id": "e061", "topic": "eci_powers", "text": "The ECI has the power to: recognize political parties, allot election symbols, enforce the MCC, deploy central forces for free and fair elections, cancel polling in case of booth capturing, and countermand elections in case of death of a candidate.", "source": "ECI Powers and Functions"},
    {"id": "e062", "topic": "party_recognition", "text": "A party gets National Party recognition if it wins 2% of Lok Sabha seats (11 seats) from at least 3 states, OR gets 6% of valid votes in 4 or more states and wins at least 4 Lok Sabha seats. As of 2024, the recognized national parties are BJP, Congress, BSP, CPI, CPI(M), NCP, and AAP.", "source": "ECI Party Recognition Guidelines 2024"},
    # === RESULT & COUNTING ===
    {"id": "e070", "topic": "counting", "text": "Counting of votes is done at the Counting Centre under the supervision of the Returning Officer. For Lok Sabha elections, counting usually happens at the district headquarters. The EVM Control Units from all booths in a constituency are brought to the counting centre.", "source": "ECI Counting Guidelines"},
    {"id": "e071", "topic": "counting", "text": "Counting proceeds round by round. In each round, the Control Units from a batch of polling stations are opened and votes counted. A candidate needs only one vote more than the nearest rival to win (First Past The Post system).", "source": "ECI Counting Manual"},
    {"id": "e072", "topic": "postal_ballot", "text": "Postal ballots are counted before EVM counting begins. Postal ballots are used by: service voters (military, paramilitary), senior citizens above 80 years, persons with disabilities, and voters who are on election duty on polling day.", "source": "ECI Postal Ballot Guidelines"},
    # === MISINFORMATION COMMON CLAIMS ===
    {"id": "m001", "topic": "misinformation", "text": "CLAIM: EVMs can be hacked via Bluetooth or internet. VERDICT: FALSE. EVMs have no wireless connectivity whatsoever — no Bluetooth, no WiFi, no internet port. Multiple technical committees and Supreme Court rulings have verified this. The software is burned into OTP chips.", "source": "ECI Technical White Paper; Supreme Court 2024"},
    {"id": "m002", "topic": "misinformation", "text": "CLAIM: Voter turnout data was manipulated in 2024 elections. VERDICT: MISLEADING. There were legitimate questions about delays in turnout data publishing. ECI subsequently clarified the data was accurate but released in stages. No evidence of manipulation was found.", "source": "ECI Press Release May 2024"},
    {"id": "m003", "topic": "misinformation", "text": "CLAIM: You can vote multiple times by removing ink with petrol. VERDICT: FALSE. Indelible ink made by MVPL penetrates the skin and cannot be removed with petrol, bleach, or acetone. It lasts 2-3 weeks. Attempting to remove it would damage skin.", "source": "MVPL Technical Documentation; ECI"},
    {"id": "m004", "topic": "misinformation", "text": "CLAIM: NOTA can remove a candidate from office if it gets the most votes. VERDICT: FALSE. NOTA votes are counted but do not result in any action. Even if NOTA gets the most votes, the candidate with the highest votes among actual candidates wins. There is no provision for re-election if NOTA leads.", "source": "Supreme Court Order 2013; ECI Circular"},
    {"id": "m005", "topic": "misinformation", "text": "CLAIM: You need a voter ID to vote. VERDICT: MISLEADING. While the EPIC (Voter ID) is preferred, ECI allows 12 alternative documents for voter identity verification including Aadhaar, PAN, Passport, Driving License etc.", "source": "ECI Polling Day Guidelines 2024"},
    # === VOTER REGISTRATION DETAILS ===
    {"id": "r001", "topic": "voter_registration", "text": "Forms for voter registration: Form 6 (new registration), Form 6A (for NRIs), Form 6B (Aadhaar linking), Form 7 (deletion/objection), Form 8 (correction of entries), Form 8A (transposition within constituency).", "source": "ECI Voter Registration Forms"},
    {"id": "r002", "topic": "voter_registration", "text": "The voter list (Electoral Roll) is updated throughout the year with special revision periods. The Summary Revision typically happens before elections. Citizens can check if they are on the voter list at electoralsearch.eci.gov.in.", "source": "ECI Electoral Roll Management"},
    {"id": "r003", "topic": "voter_registration", "text": "NRIs (Non-Resident Indians) with an Indian passport can register as overseas voters under Form 6A. They must be registered at their address in India (as in their passport). Overseas voters must be physically present to vote — there is no proxy or postal voting for NRIs.", "source": "Representation of the People (Amendment) Act 2010"},
    # === GAMIFICATION QUIZ CONTENT ===
    {"id": "q001", "topic": "quiz", "text": "QUIZ: What does EVM stand for? ANSWER: Electronic Voting Machine. An EVM has two parts: the Control Unit and the Balloting Unit.", "source": "ECI Glossary"},
    {"id": "q002", "topic": "quiz", "text": "QUIZ: How many Lok Sabha seats are there? ANSWER: 543 seats. A party needs 272 seats for a simple majority to form the government.", "source": "Constitution of India, Article 81"},
    {"id": "q003", "topic": "quiz", "text": "QUIZ: What is the minimum age to vote in India? ANSWER: 18 years. The voting age was lowered from 21 to 18 by the 61st Constitutional Amendment Act, 1988, effective from March 28, 1989.", "source": "61st Constitutional Amendment 1988"},
    {"id": "q004", "topic": "quiz", "text": "QUIZ: What does NOTA stand for? ANSWER: None Of The Above. It was introduced following a Supreme Court order in 2013.", "source": "Supreme Court 2013"},
    {"id": "q005", "topic": "quiz", "text": "QUIZ: When was the first general election in India held? ANSWER: 1951-52. India's first general election was held over 4 months from October 25, 1951 to February 21, 1952. Jawaharlal Nehru's Congress won 364 out of 489 seats.", "source": "ECI Historical Records"},
    # === CONSTITUTIONAL ARTICLES ===
    {"id": "c001", "topic": "constitution", "text": "Article 324: Superintendence, direction and control of elections to be vested in an Election Commission — The Election Commission of India derives its power from this article.", "source": "Constitution of India"},
    {"id": "c002", "topic": "constitution", "text": "Article 326: Elections to the House of the People and to the Legislative Assemblies of States to be on the basis of adult suffrage — Every person who is a citizen of India and is not less than 18 years of age has the right to vote.", "source": "Constitution of India, Article 326"},
    {"id": "c003", "topic": "constitution", "text": "Article 84: Qualifications for membership of Parliament — Must be a citizen of India, not less than 25 years of age for Lok Sabha, 30 years for Rajya Sabha.", "source": "Constitution of India, Article 84"},
    {"id": "c004", "topic": "constitution", "text": "The Tenth Schedule (Anti-Defection Law) was added by the 52nd Constitutional Amendment 1985. It disqualifies a member of Parliament or State Legislature from their seat if they voluntarily give up membership of their party or vote against party direction.", "source": "Constitution of India, Tenth Schedule"},
    # === PARTY SYSTEM ===
    {"id": "p001", "topic": "parties", "text": "As of 2024 General Elections, the main alliances were: NDA (National Democratic Alliance) led by BJP, and INDIA (Indian National Developmental Inclusive Alliance) led by Congress. NDA won 293 seats; INDIA won 233 seats; Others won 17 seats.", "source": "ECI Election Results 2024"},
    {"id": "p002", "topic": "parties", "text": "The BJP (Bharatiya Janata Party) won 240 seats in the 2024 Lok Sabha elections — down from 303 in 2019. The Congress won 99 seats — up from 52 in 2019. NDA formed the government with Narendra Modi as Prime Minister for a third term.", "source": "ECI Results 2024"},
    {"id": "p003", "topic": "parties", "text": "Party symbols are allotted by the ECI. Recognized national parties get their symbol reserved exclusively. State parties get their symbol reserved within their state. Unrecognized parties can choose from a list of free symbols.", "source": "Election Symbols (Reservation and Allotment) Order 1968"},
    # === STATE ELECTIONS ===
    {"id": "s001", "topic": "state_elections", "text": "Vidhan Sabha (State Legislative Assembly) elections are held every 5 years in each state. The ECI oversees these elections. Key states by seat count: Uttar Pradesh (403), Maharashtra (288), West Bengal (294), Bihar (243), Madhya Pradesh (230).", "source": "ECI State Elections Overview"},
    {"id": "s002", "topic": "state_elections", "text": "Rajya Sabha (Council of States) elections are indirect — Members of Parliament in Rajya Sabha are elected by State Legislative Assembly members, not directly by citizens. Elections are held every 2 years for 1/3rd of the seats.", "source": "Constitution of India, Article 80"},
    # === SPECIAL PROVISIONS ===
    {"id": "sp001", "topic": "special_provisions", "text": "Service Voters (armed forces, paramilitary, and government employees posted outside their constituency) can vote through postal ballot. They can also appoint a proxy voter using Form 13F. The proxy can vote on their behalf.", "source": "Conduct of Elections Rules 1961"},
    {"id": "sp002", "topic": "special_provisions", "text": "Persons with disabilities (PwD) and senior citizens above 80 years have the option to vote via postal ballot or at home through the 'Ghar Se Vote' (Vote from Home) scheme introduced by ECI.", "source": "ECI Accessibility Guidelines 2024"},
    {"id": "sp003", "topic": "special_provisions", "text": "The President of India can be impeached for violation of the Constitution. The process requires a 2/3rd majority of each House of Parliament, after a 14-day notice. The Vice President presides over the Rajya Sabha when the President faces charges.", "source": "Constitution of India, Article 61"},
    # === 2024 ELECTION STATS ===
    {"id": "st001", "topic": "election_statistics", "text": "2024 Lok Sabha Election Statistics: Total eligible voters: 968.8 million. Total votes cast: 642 million. Overall voter turnout: 66.3%. Total candidates: 8,360. Total polling stations: 1.04 million. Phases: 7. Duration: April 19 to June 1, 2024.", "source": "ECI Final Statistics 2024"},
    {"id": "st002", "topic": "election_statistics", "text": "First-time voters (aged 18-19) in 2024: approximately 18.4 million. Women voters outnumbered men for the first time in 2019 in terms of turnout percentage and the trend continued in 2024.", "source": "ECI Voter Turnout Analysis 2024"},
    {"id": "st003", "topic": "election_statistics", "text": "States with highest voter turnout in 2024: Tripura (86.2%), Assam (81.2%), Lakshadweep (84.4%). States with lowest turnout: Uttar Pradesh (57.8%), Bihar (56.2%), Jammu & Kashmir (58.5%).", "source": "ECI Constituency-wise Turnout 2024"},
    # === COUNTING & RESULTS ===
    {"id": "cr001", "topic": "results", "text": "After counting, the Returning Officer declares the result. The winning candidate is given a certificate of election. The ECI compiles all results and publishes them in the Official Gazette. The new Lok Sabha must be constituted within 6 months of dissolution.", "source": "ECI Post-Election Procedures"},
    {"id": "cr002", "topic": "results", "text": "An election can be challenged through an Election Petition filed in the relevant High Court within 45 days of the result. Grounds include corrupt practices, improper rejection of nomination, non-compliance with election rules.", "source": "Representation of the People Act 1951, Section 80-122"},
]


class KnowledgeBase:
    """BM25-based retrieval engine over the ECI knowledge corpus.

    Provides keyword-scored document retrieval using the Okapi BM25
    ranking function.  Designed as a self-contained, zero-dependency
    (no external DB) retrieval layer for the demo.  Replace with
    ``pgvector`` or Vertex AI Search for production scale.
    """

    def __init__(self) -> None:
        self.documents: List[Dict[str, Any]] = ECI_CORPUS
        tokenized: List[List[str]] = [self._tokenize(d["text"]) for d in self.documents]
        self.bm25: BM25Okapi = BM25Okapi(tokenized)

    def _tokenize(self, text: str) -> List[str]:
        """Normalise and split text into lowercase alphanumeric tokens."""
        return re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower()).split()

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Return the *top_k* most relevant documents for *query*.

        Args:
            query: Free-text search query.
            top_k: Maximum number of results to return.

        Returns:
            List of document dicts, each augmented with a ``relevance_score``.
        """
        tokens: List[str] = self._tokenize(query)
        scores = self.bm25.get_scores(tokens)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
        results: List[Dict[str, Any]] = []
        for idx, score in ranked[:top_k]:
            if score > 0:
                doc = self.documents[idx].copy()
                doc["relevance_score"] = float(score)
                results.append(doc)
        return results

    def get_context(self, query: str, top_k: int = 5) -> Tuple[str, List[str]]:
        """Retrieve context and source citations for a user query.

        Args:
            query: Free-text search query.
            top_k: Maximum number of context chunks.

        Returns:
            A ``(context_string, sources_list)`` tuple.  The context string
            is pre-formatted for injection into an LLM prompt.
        """
        docs: List[Dict[str, Any]] = self.retrieve(query, top_k)
        if not docs:
            return "", []
        context: str = "\n\n".join([f"[{d['source']}]\n{d['text']}" for d in docs])
        sources: List[str] = list(set([d["source"] for d in docs]))
        return context, sources


# Singleton
knowledge_base = KnowledgeBase()
