import sys
import streamlit as st
import os

st.title("Environment Check")
st.write(f"Python Executable: {sys.executable}")
st.write(f"CWD: {os.getcwd()}")
st.write(f"Path: {sys.path}")

try:
    import sklearn
    st.success(f"sklearn imported! Version: {sklearn.__version__}")
except ImportError as e:
    st.error(f"ImportError: {e}")

try:
    import pandas_ta_classic
    st.success(f"pandas_ta_classic imported! Version: {pandas_ta_classic.version}")
except ImportError as e:
    st.error(f"ImportError: {e}")
