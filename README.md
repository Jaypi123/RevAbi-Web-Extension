# RevAbi Extension

RevAbi is a browser-based review analysis tool designed to help users make smarter purchasing decisions by providing clear, summarized, and sentiment-analyzed product reviews. It scrapes customer feedback from e-commerce websites, filters out spam and irrelevant content, and presents users with essential insights in a user-friendly format.

## Features

- 🔎 **Review Scraping**: Dynamically scrapes customer reviews from major e-commerce websites.
- 🧹 **Spam Detection**: Filters out irrelevant or spam reviews using a machine learning model.
- ✨ **Summarization**: Condenses long reviews into concise summaries for quicker reading.
- 😊 **Sentiment Analysis**: Classifies reviews as Positive, Neutral, or Negative using a deep learning model.
- 📊 **Pros and Cons Extraction**: Highlights key positive and negative points from real user feedback.
- 📊 **Sentiment Distribution**: Displays sentiment percentages through easy-to-understand visuals.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask (Python)
- **NLP Models**:
    - Summarization: `facebook/bart-large-cnn`
    - Sentiment Analysis: `cardiffnlp/twitter-roberta-base-sentiment`
- **Machine Learning**: Support Vector Machine (SVM) for spam detection
- **Libraries**:
    - Flask
    - Flask-CORS
    - Transformers (Hugging Face)
    - Scikit-learn (for SVM and TF-IDF Vectorizer)
    - Joblib (for model loading)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/revabi-extension.git
```

2. Navigate to the project directory:

```bash
cd revabi-extension
```

3. Install the required Python packages:

```bash
pip install flask flask-cors transformers scikit-learn joblib
```

4. Run the backend server:

```bash
python backend.py
```

5. Load the Chrome extension:
    - Open Chrome and navigate to `chrome://extensions/`
    - Enable **Developer Mode**
    - Click **Load unpacked** and select the `RevAbi Extension` folder.

## Project Structure

```
RevAbi Extension/
│
├── backend.py             # Flask server handling API requests
├── best_review_model.pkl  # Trained SVM model for spam detection
├── tfidf_vectorizer.pkl    # TF-IDF vectorizer used during model training
├── popup.html             # Frontend UI
├── popup.js               # Frontend logic
├── manifest.json          # Chrome extension manifest file
└── assets/                # Images, icons, and style sheets
```

## Future Improvements

- Make the scraping fully **dynamic** to adapt to changes in website structure automatically.
- Further **optimize processing speed** to handle large volumes of reviews faster.
- Improve **UI/UX** with a more modern and responsive design.
- Expand compatibility to other browsers such as **Safari** and **Firefox**.
- Add **image scraping** to enrich product insights with visual context.



