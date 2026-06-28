# StackFlow - Unit Tests
# Run with: python -m pytest test_stack.py -v

import pytest
from app import Stack, Node


class TestNode:
    """Tests for Node class"""

    def test_node_init(self):
        node = Node(42)
        assert node.value == 42
        assert node.next is None

    def test_node_string_value(self):
        node = Node("hello")
        assert node.value == "hello"


class TestStack:
    """Tests for Stack class"""

    def test_init(self):
        stack = Stack()
        assert stack.isEmpty() is True
        assert stack.getSize() == 0

    def test_push(self):
        stack = Stack()
        stack.push("A")
        assert stack.isEmpty() is False
        assert stack.getSize() == 1

    def test_push_multiple(self):
        stack = Stack()
        stack.push("A")
        stack.push("B")
        stack.push("C")
        assert stack.getSize() == 3

    def test_peek(self):
        stack = Stack()
        stack.push("A")
        assert stack.peek() == "A"

    def test_peek_top_after_push(self):
        stack = Stack()
        stack.push("A")
        stack.push("B")
        assert stack.peek() == "B"

    def test_peek_does_not_remove(self):
        stack = Stack()
        stack.push("A")
        stack.push("B")
        stack.peek()
        assert stack.getSize() == 2

    def test_pop(self):
        stack = Stack()
        stack.push("A")
        value = stack.pop()
        assert value == "A"
        assert stack.isEmpty() is True

    def test_pop_lifo_order(self):
        stack = Stack()
        stack.push("A")
        stack.push("B")
        stack.push("C")
        assert stack.pop() == "C"
        assert stack.pop() == "B"
        assert stack.pop() == "A"

    def test_pop_updates_size(self):
        stack = Stack()
        stack.push("A")
        stack.push("B")
        stack.pop()
        assert stack.getSize() == 1

    def test_peek_empty_raises(self):
        stack = Stack()
        with pytest.raises(Exception, match="Peeking from an empty stack"):
            stack.peek()

    def test_pop_empty_raises(self):
        stack = Stack()
        with pytest.raises(Exception, match="Popping from an empty stack"):
            stack.pop()

    def test_str_empty(self):
        stack = Stack()
        assert str(stack) == ""

    def test_str_single(self):
        stack = Stack()
        stack.push("A")
        assert str(stack) == "A"

    def test_str_multiple(self):
        stack = Stack()
        stack.push("A")
        stack.push("B")
        assert str(stack) == "B->A"

    def test_to_list_empty(self):
        stack = Stack()
        assert stack.to_list() == []

    def test_to_list(self):
        stack = Stack()
        stack.push("A")
        stack.push("B")
        assert stack.to_list() == ["B", "A"]

    def test_from_list_empty(self):
        stack = Stack()
        stack.from_list([])
        assert stack.isEmpty() is True
        assert stack.getSize() == 0

    def test_from_list(self):
        stack = Stack()
        stack.from_list(["A", "B", "C"])
        assert stack.getSize() == 3
        assert stack.peek() == "A"
        assert stack.to_list() == ["A", "B", "C"]

    def test_from_list_replaces_existing(self):
        stack = Stack()
        stack.push("X")
        stack.from_list(["A", "B"])
        assert stack.getSize() == 2
        assert stack.peek() == "A"
        assert stack.to_list() == ["A", "B"]

    def test_push_pop_cycle(self):
        stack = Stack()
        stack.push("A")
        stack.push("B")
        stack.pop()
        stack.push("C")
        assert stack.to_list() == ["C", "A"]

    def test_many_operations(self):
        stack = Stack()
        for i in range(100):
            stack.push(str(i))
        assert stack.getSize() == 100
        for _ in range(50):
            stack.pop()
        assert stack.getSize() == 50
        assert stack.peek() == "49"


class TestLIFO:
    """Tests to verify LIFO behavior"""

    def test_lifo_order(self):
        stack = Stack()
        items = ["first", "second", "third", "fourth"]
        for item in items:
            stack.push(item)
        popped = []
        while not stack.isEmpty():
            popped.append(stack.pop())
        assert popped == ["fourth", "third", "second", "first"]

    def test_interleaved_ops(self):
        stack = Stack()
        stack.push("1")
        stack.push("2")
        stack.pop()
        stack.push("3")
        assert stack.peek() == "3"
        assert stack.getSize() == 2
        assert stack.to_list() == ["3", "1"]
