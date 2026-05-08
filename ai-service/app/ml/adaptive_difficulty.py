"""
ML Component 3: Adaptive Difficulty Engine
===========================================
Uses statistical analysis of session performance history to:
1. Compute dynamic difficulty adjustment (up/down)
2. Detect weak topics using score-weighted frequency analysis
3. Generate topic priority queue for next question selection

University AIML component: demonstrates:
- Moving average computation
- Score-based reinforcement (reward correct topics, focus on weak)
- Topic modeling via frequency+score weighting
- Bayesian-style confidence estimation
"""

import math
from collections import defaultdict
from statistics import mean, stdev
from typing import Optional


# ─── Difficulty scoring thresholds ────────────────────────────────────────────
DIFFICULTY_THRESHOLDS = {
    "upgrade_to_hard":   8.5,   # avg score > 8.5 → move to hard
    "upgrade_to_medium": 6.5,   # avg score > 6.5 → move to medium  
    "downgrade_to_easy": 4.0,   # avg score < 4.0 → move to easy
    "downgrade_to_med":  6.0,   # avg score < 6.0 → move to medium
}

DIFFICULTY_ORDER = ["easy", "medium", "hard"]


def _exponential_moving_average(scores: list[float], alpha: float = 0.4) -> float:
    """
    Compute EMA of scores — recent scores weighted more heavily.
    alpha=0.4 means recent score has 40% weight, previous EMA has 60%.
    Better than simple average for detecting performance trends.
    """
    if not scores:
        return 5.0
    ema = scores[0]
    for score in scores[1:]:
        ema = alpha * score + (1 - alpha) * ema
    return ema


def _compute_topic_weakness_scores(session_history: list[dict]) -> dict[str, float]:
    """
    Compute weakness score per topic using score-weighted frequency.
    
    Algorithm:
    - For each topic, track all scores
    - weakness_score = (10 - avg_score) * frequency_weight
    - Topics with low scores + high frequency = most weak
    """
    topic_scores: dict[str, list[float]] = defaultdict(list)
    
    for item in session_history:
        topic = item.get("topic", "General")
        score = float(item.get("aiScore", 5.0))
        if topic and topic != "General":
            topic_scores[topic].append(score)
    
    weakness_scores = {}
    for topic, scores in topic_scores.items():
        avg = mean(scores)
        freq_weight = math.log(len(scores) + 1)  # logarithmic frequency penalty
        weakness = (10.0 - avg) * freq_weight
        weakness_scores[topic] = round(weakness, 3)
    
    # Sort by weakness score (highest = most weak)
    return dict(sorted(weakness_scores.items(), key=lambda x: x[1], reverse=True))


def _detect_performance_trend(scores: list[float]) -> str:
    """
    Detect if candidate is improving, declining, or stable.
    Uses linear regression slope on recent scores.
    """
    if len(scores) < 3:
        return "insufficient_data"
    
    n = len(scores)
    x = list(range(n))
    
    # Linear regression slope
    x_mean = mean(x)
    y_mean = mean(scores)
    
    numerator = sum((x[i] - x_mean) * (scores[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    
    if denominator == 0:
        return "stable"
    
    slope = numerator / denominator
    
    if slope > 0.5:
        return "improving"
    elif slope < -0.5:
        return "declining"
    return "stable"


def _confidence_interval(scores: list[float]) -> tuple[float, float]:
    """
    Compute 95% confidence interval for score estimate.
    Uses t-distribution approximation for small samples.
    """
    if len(scores) < 2:
        return (0.0, 10.0)
    
    n = len(scores)
    avg = mean(scores)
    sd = stdev(scores)
    
    # t-critical value approximation (95% CI)
    t_critical = 2.0 if n < 10 else 1.96
    margin = t_critical * (sd / math.sqrt(n))
    
    return (
        round(max(0.0, avg - margin), 2),
        round(min(10.0, avg + margin), 2)
    )


def compute_adaptive_difficulty(
    current_difficulty: str,
    session_history: list[dict],
    window: int = 4
) -> dict:
    """
    Main adaptive difficulty computation using ML-based performance analysis.
    
    Algorithm:
    1. Extract recent scores (sliding window)
    2. Compute EMA (exponential moving average) — emphasizes recent performance
    3. Apply threshold rules to determine difficulty direction
    4. Compute confidence interval for reliability estimate
    5. Detect trend (improving/declining/stable)
    
    Returns:
        {
            "recommended_difficulty": str,
            "direction": str (upgrade/downgrade/maintain),
            "ema_score": float,
            "trend": str,
            "confidence_interval": tuple,
            "weak_topics": list,
            "topic_weakness_map": dict,
            "reasoning": str
        }
    """
    if not session_history:
        return {
            "recommended_difficulty": current_difficulty,
            "direction": "maintain",
            "ema_score": 5.0,
            "trend": "no_data",
            "confidence_interval": (0.0, 10.0),
            "weak_topics": [],
            "topic_weakness_map": {},
            "reasoning": "No session history — maintaining current difficulty",
            "method": "EMA + Linear Regression Trend Analysis"
        }
    
    # ── Extract scores ──────────────────────────────────────────────────────────
    all_scores = [float(h.get("aiScore", 5.0)) for h in session_history]
    recent_scores = all_scores[-window:]  # sliding window
    
    # ── Compute EMA ────────────────────────────────────────────────────────────
    ema = _exponential_moving_average(recent_scores)
    
    # ── Detect trend ───────────────────────────────────────────────────────────
    trend = _detect_performance_trend(all_scores)
    
    # ── Compute confidence interval ────────────────────────────────────────────
    ci = _confidence_interval(recent_scores)
    
    # ── Determine difficulty adjustment ────────────────────────────────────────
    curr_idx = DIFFICULTY_ORDER.index(current_difficulty) if current_difficulty in DIFFICULTY_ORDER else 1
    
    direction = "maintain"
    new_difficulty = current_difficulty
    reasoning = ""
    
    if ema >= DIFFICULTY_THRESHOLDS["upgrade_to_hard"] and current_difficulty != "hard":
        if curr_idx < 2:
            new_difficulty = DIFFICULTY_ORDER[curr_idx + 1]
            direction = "upgrade"
            reasoning = f"EMA score {ema:.1f} ≥ {DIFFICULTY_THRESHOLDS['upgrade_to_hard']} — candidate performing excellently"
    elif ema >= DIFFICULTY_THRESHOLDS["upgrade_to_medium"] and current_difficulty == "easy":
        new_difficulty = "medium"
        direction = "upgrade"
        reasoning = f"EMA score {ema:.1f} ≥ {DIFFICULTY_THRESHOLDS['upgrade_to_medium']} — ready for medium difficulty"
    elif ema < DIFFICULTY_THRESHOLDS["downgrade_to_easy"] and current_difficulty != "easy":
        if curr_idx > 0:
            new_difficulty = DIFFICULTY_ORDER[curr_idx - 1]
            direction = "downgrade"
            reasoning = f"EMA score {ema:.1f} < {DIFFICULTY_THRESHOLDS['downgrade_to_easy']} — difficulty too high"
    elif ema < DIFFICULTY_THRESHOLDS["downgrade_to_med"] and current_difficulty == "hard":
        new_difficulty = "medium"
        direction = "downgrade"
        reasoning = f"EMA score {ema:.1f} < {DIFFICULTY_THRESHOLDS['downgrade_to_med']} — stepping down from hard"
    else:
        reasoning = f"EMA score {ema:.1f} within acceptable range — maintaining {current_difficulty}"
    
    # Trend override: if rapidly declining, downgrade regardless
    if trend == "declining" and direction == "maintain" and ema < 5.0 and curr_idx > 0:
        new_difficulty = DIFFICULTY_ORDER[curr_idx - 1]
        direction = "downgrade"
        reasoning += " (trend: rapid decline detected)"
    
    # ── Compute weak topics ────────────────────────────────────────────────────
    topic_weakness = _compute_topic_weakness_scores(session_history)
    weak_topics = [t for t, score in topic_weakness.items() if score > 3.0][:5]
    
    return {
        "recommended_difficulty": new_difficulty,
        "direction": direction,
        "ema_score": round(ema, 3),
        "simple_average": round(mean(recent_scores), 3),
        "trend": trend,
        "confidence_interval": ci,
        "scores_analyzed": len(recent_scores),
        "weak_topics": weak_topics,
        "topic_weakness_map": topic_weakness,
        "reasoning": reasoning,
        "method": "EMA + Linear Regression + Score-Weighted Topic Analysis"
    }


def get_next_topic_priority(
    weak_topics: list[str],
    answered_topics: list[str],
    session_history: list[dict],
    all_available_topics: Optional[list[str]] = None
) -> dict:
    """
    Compute priority queue for next topic selection.
    
    Priority rules (highest first):
    1. Weak topics not yet retested in this session
    2. Weak topics that need retesting
    3. Topics not covered at all
    4. Random from available pool
    
    Returns priority-ranked list with scores.
    """
    topic_weakness = _compute_topic_weakness_scores(session_history)
    answered_set = set(answered_topics)
    
    priorities = {}
    
    for topic, weakness in topic_weakness.items():
        if topic not in answered_set:
            priorities[topic] = weakness * 1.5  # bonus for untested weak topic
        else:
            priorities[topic] = weakness * 0.5  # lower priority if already tested
    
    # Add available topics not yet covered
    if all_available_topics:
        for topic in all_available_topics:
            if topic not in priorities:
                priorities[topic] = 2.0 if topic not in answered_set else 0.5
    
    ranked = sorted(priorities.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "priority_queue": [{"topic": t, "priority_score": round(s, 2)} for t, s in ranked[:10]],
        "top_priority": ranked[0][0] if ranked else "General",
        "weak_count": len(weak_topics),
        "method": "Score-Weighted Frequency Analysis"
    }
