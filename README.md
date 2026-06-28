# StackFlow

Interactive Stack (LIFO) Visualization Web Application.

## Features

- Push / Pop / Peek operations with animated visualization
- Color-coded stack elements
- Operation history log
- File-based data persistence
- Terminal-style UI

## Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

Open browser at `http://localhost:5000`.

## Run Tests

```bash
pip install pytest
python -m pytest test_stack.py -v
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel
```

## Project Structure

```
StackFlow/
  app.py             # Flask app + Stack class
  requirements.txt   # Python dependencies
  vercel.json        # Vercel deployment config
  test_stack.py      # Unit tests
  static/
    style.css        # Terminal-style CSS
    app.js           # Frontend logic + animations
  templates/
    index.html       # Main page
```

## Stack Operations (from PDF)

| Operation | Description |
|-----------|-------------|
| push(val) | Add element to top |
| pop()     | Remove and return top element |
| peek()    | Return top element without removing |
| isEmpty() | Check if stack is empty |
| getSize() | Return number of elements |
