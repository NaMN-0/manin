# Smart US Stock Market Analyser

## Setup
1. Open a terminal in this directory.
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: We are using `pandas-ta-classic` instead of `pandas-ta` for better compatibility with Python 3.10+.*

## Running the Application
Run the Streamlit server:
```bash
streamlit run market_server.py
```
(If not activated, you can run `.\venv\Scripts\streamlit run market_server.py`)

## Features
- **Technical Analysis**: Trend (SMA 50), Momentum (RSI, MACD), Volume.
- **Sentiment Analysis**: Fetches recent news and analyzes sentiment.
- **Visualization**: Interactive charts with Plotly.
