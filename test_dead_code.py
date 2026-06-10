import os
import sys
import json
import hashlib  # unused import

UNUSED_CONSTANT = "never_read"


def used_function():
    return os.getcwd()


def unused_function_one():
    return sys.version


def unused_function_two(x, y):
    data = {"x": x, "y": y}
    return json.dumps(data)


class UnusedClass:
    def method(self):
        return hashlib.md5(b"test").hexdigest()


if __name__ == "__main__":
    print(used_function())
