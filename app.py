# StackFlow - Interactive Stack Visualization
# A web-based application to demonstrate Stack (LIFO) operations

from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
import json

app = Flask(__name__)

# Database configuration
# Local: SQLite | Production: PostgreSQL via DATABASE_URL
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///stackflow.db')
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# --- Database Model ---
class StackState(db.Model):
    """Stores the shared stack as a JSON list."""
    id = db.Column(db.Integer, primary_key=True)
    stack_data = db.Column(db.Text, default='[]')
    updated_at = db.Column(db.DateTime, server_default=db.func.now(),
                           onupdate=db.func.now())

    def to_list(self):
        return json.loads(self.stack_data)

    def from_list(self, lst):
        self.stack_data = json.dumps(lst)


class OperationLog(db.Model):
    """Logs every operation performed on the stack."""
    id = db.Column(db.Integer, primary_key=True)
    op_type = db.Column(db.String(10), nullable=False)
    value = db.Column(db.String(500), nullable=True)
    stack_size = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())


# --- Stack Logic (LinkedList-based, mirroring PDF) ---
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class Stack:
    def __init__(self):
        self.head = Node("head")
        self.size = 0

    def __str__(self):
        cur = self.head.next
        out = ""
        while cur is not None:
            out += str(cur.value) + "->"
            cur = cur.next
        return out[:-2] if out else ""

    def getSize(self):
        return self.size

    def isEmpty(self):
        return self.size == 0

    def peek(self):
        if self.isEmpty():
            raise Exception("Peeking from an empty stack")
        return self.head.next.value

    def push(self, value):
        node = Node(value)
        node.next = self.head.next
        self.head.next = node
        self.size += 1

    def pop(self):
        if self.isEmpty():
            raise Exception("Popping from an empty stack")
        remove = self.head.next
        self.head.next = self.head.next.next
        self.size -= 1
        return remove.value

    def to_list(self):
        result = []
        cur = self.head.next
        while cur is not None:
            result.append(cur.value)
            cur = cur.next
        return result

    def from_list(self, lst):
        self.head.next = None
        self.size = 0
        for item in lst:
            self.push(item)


# --- Helper: load / save from database ---
def load_stack():
    state = StackState.query.get(1)
    if state is None:
        state = StackState(id=1, stack_data='[]')
        db.session.add(state)
        db.session.commit()
    s = Stack()
    s.from_list(state.to_list())
    return s


def save_stack(stack):
    state = StackState.query.get(1)
    if state is None:
        state = StackState(id=1)
        db.session.add(state)
    state.from_list(stack.to_list())
    db.session.commit()


def log_operation(op_type, value=None, stack_size=0):
    entry = OperationLog(op_type=op_type, value=str(value) if value else None,
                         stack_size=stack_size)
    db.session.add(entry)
    db.session.commit()


# --- Routes ---
@app.route('/')
def index():
    stack = load_stack()
    return render_template('index.html',
                           stack_size=stack.getSize(),
                           stack_str=str(stack),
                           stack_list=stack.to_list())


@app.route('/api/stack', methods=['GET'])
def get_stack():
    stack = load_stack()
    return jsonify({
        'size': stack.getSize(),
        'isEmpty': stack.isEmpty(),
        'stack': stack.to_list(),
        'stack_str': str(stack)
    })


@app.route('/api/stack/push', methods=['POST'])
def api_push():
    try:
        data = request.get_json()
        value = data.get('value', '')
        stack = load_stack()
        stack.push(value)
        save_stack(stack)
        log_operation('push', value, stack.getSize())
        return jsonify({'success': True, 'value': value, 'size': stack.getSize()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/stack/pop', methods=['POST'])
def api_pop():
    try:
        stack = load_stack()
        value = stack.pop()
        save_stack(stack)
        log_operation('pop', value, stack.getSize())
        return jsonify({'success': True, 'value': value, 'size': stack.getSize()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/stack/peek', methods=['GET'])
def api_peek():
    try:
        stack = load_stack()
        value = stack.peek()
        log_operation('peek', value, stack.getSize())
        return jsonify({'success': True, 'value': value})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/stack/reset', methods=['POST'])
def api_reset():
    stack = Stack()
    save_stack(stack)
    log_operation('reset', None, 0)
    return jsonify({'success': True, 'size': 0})


@app.route('/api/history', methods=['GET'])
def api_history():
    logs = OperationLog.query.order_by(OperationLog.id.desc()).limit(50).all()
    result = []
    for log in logs:
        result.append({
            'type': log.op_type,
            'value': log.value,
            'size': log.stack_size,
            'timestamp': log.timestamp.isoformat() if log.timestamp else None
        })
    return jsonify(result)


# --- Create tables on startup ---
with app.app_context():
    db.create_all()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
