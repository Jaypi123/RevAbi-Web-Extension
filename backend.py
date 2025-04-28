from flask import Flask, jsonify, request
from flask_cors import CORS
from transformers import pipeline
import joblib

# Initialize the Flask app and CORS
app = Flask(__name__)
CORS(app)

# Load pretrained models
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
sentiment_analysis = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")
spam_model = joblib.load("C:/Users/CCA/Downloads/RevAbi Extension/best_review_model.pkl")  # Trained spam detection model
vectorizer = joblib.load("C:/Users/CCA/Downloads/RevAbi Extension/tfidf_vectorizer.pkl")  # TF-IDF vectorizer used during training

# Function to summarize reviews
def summarize_review(review, min_length=30, max_length=60):
    try:
        input_length = len(review.split())
        if input_length >= min_length:
            adjusted_max_length = min(max_length, max(36, input_length // 2))
            summary = summarizer(review, max_length=adjusted_max_length, min_length=min_length, do_sample=False)
            return summary[0]['summary_text']
        return "No summary"
    except Exception as e:
        print(f"Summarization error: {e}")
        return "No summary"

# Function to analyze sentiment
def analyze_sentiment(review):
    result = sentiment_analysis(review)[0]
    sentiment_label = result['label']
    score = result['score']

    if sentiment_label == 'LABEL_2' and score > 0.75:
        return "Positive"
    elif sentiment_label == 'LABEL_1':
        return "Neutral"
    elif sentiment_label == 'LABEL_0' and score > 0.7:
        return "Negative"
    elif sentiment_label == 'LABEL_0' and score <= 0.7:
        return "Neutral"
    return "Neutral"

# Function to check for spam or irrelevant using trained model
def is_irrelevant_or_spam(review):
    try:
        review_vector = vectorizer.transform([review])
        prediction = spam_model.predict(review_vector)
        # Return True if the review is "Spam" (1) or "Irrelevant" (2)
        return prediction[0] in [1, 2]  # Check for both labels
    except Exception as e:
        print(f"Spam/Irrelevant detection error: {e}")
        return False

# Function to remove reviews with one or two words
def filter_short_reviews(reviews, min_words=3):
    # Filter out reviews with less than `min_words` words
    return [review for review in reviews if len(review.split()) >= min_words]

# Extract pros and cons as concise points
def extract_pros_cons(reviews, sentiment_type, limit=6):
    exclude_phrases = ['thank you', 'seller', 'purchase again', 'bili', '5star', 'rider', 'my', 'idk', 'sya', 'cya', 'thanks', 'salamat', 'buy another', 'buy again', 'thank very much', 'hopefully']
    results = []

    for review in reviews:
        sentiment = analyze_sentiment(review)

        if sentiment == sentiment_type:
            sentences = review.split('.')
            for sentence in sentences:
                stripped_sentence = sentence.strip().lower()
                if stripped_sentence and stripped_sentence not in results and not any(phrase in stripped_sentence for phrase in exclude_phrases):
                    results.append(stripped_sentence)

        if sentiment_type == 'negative' and not results:
            results.append("Minor issues could be improved.")

    return results[:limit]

# Route to handle review data from frontend
@app.route('/api/get_reviews', methods=['POST'])
def get_reviews():
    data = request.get_json()
    reviews = data.get('reviews', [])
    star_ratings = data.get('starRatings', [])

    if not reviews:
        return jsonify({"error": "No reviews provided"}), 400

    # Filter out reviews with one or two words
    reviews = filter_short_reviews(reviews)

    summarized_reviews = []
    positive_reviews = []
    negative_reviews = []
    positive_count = 0
    neutral_count = 0
    negative_count = 0

    for review, star_rating in zip(reviews, star_ratings):
        if is_irrelevant_or_spam(review):
            print(f"Filtered (Spam/Irrelevant): {review}")
            continue

        summary = summarize_review(review)
        sentiment = analyze_sentiment(review)

        if sentiment == "Positive":
            positive_count += 1
            positive_reviews.append(review)
        elif sentiment == "Neutral":
            neutral_count += 1
        elif sentiment == "Negative":
            negative_count += 1
            negative_reviews.append(review)

        summarized_reviews.append({
            "original": review,
            "summary": summary,
            "sentiment": sentiment,
            "star_rating": star_rating
        })

    # Extract top 6 pros and cons
    pros = extract_pros_cons(positive_reviews, "Positive", limit=6)
    cons = extract_pros_cons(negative_reviews, "Negative", limit=6)

    return jsonify({
        "reviews": summarized_reviews,
        "sentiment_counts": {
            "positive": positive_count,
            "neutral": neutral_count,
            "negative": negative_count
        },
        "pros": pros,
        "cons": cons
    })

if __name__ == '__main__':
    app.run(debug=True)
