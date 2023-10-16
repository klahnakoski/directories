import ast

from mo_files import File
from mo_future import first
from mo_json import value2json
from mo_logs import logger
from mo_threads import stop_main_thread

from show.common_modules import known_missing


class Finder:
    def __init__(self, python_paths):
        self.python_paths = python_paths

    def find_imports_in_file(self, file):
        file_contents = file.read()
        try:
            tree = ast.parse(file_contents)
        except Exception:
            return []

        imports = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for n in node.names:
                    imports.append(self.find_file(file, n.name))
            elif isinstance(node, ast.ImportFrom):
                module = node.module
                if not module:
                    module = ""
                if node.level:
                    module = "." * node.level + module
                imports.append(self.find_file(file, module))

        return imports

    def find_file(self, source_file, module):
        try:
            if module.startswith("."):
                for i, c in enumerate(module):
                    if c != ".":
                        level = "/.." * i
                        break
                else:
                    level = "/.." * len(module)
                paths = [source_file / level]
                module = module[i:]
            else:
                paths = self.python_paths

            for p in paths:
                if not module:
                    candidate = File(p).set_extension("py")
                else:
                    candidate = File(p) / (module.replace(".", "/") + ".py")
                if candidate.exists:
                    return candidate

                if not module:
                    candidate = File(p) / "__init__.py"
                else:
                    candidate = File(p) / module.replace(".", "/") / "__init__.py"
                if candidate.exists:
                    return candidate
        except Exception as cause:
            logger.warning("problem", cause=cause)
        if module in known_missing:
            return None
        known_missing.add(module)
        logger.info("Could not find {module} from {source_file}", module=module, source_file=source_file)

    def scan(self, source, output):
        graph = {}
        for leaf in source.leaves:
            if "/test" in leaf.rel_path:
                continue
            if leaf.extension != "py":
                continue
            logger.info("{file}", file=leaf.abs_path)
            imports = list(x.abs_path for x in self.find_imports_in_file(leaf) if x is not None)
            if imports:
                graph[leaf.abs_path] = imports

        # remove common prefix
        prefix = first(graph.keys())
        for k, vv in graph.items():
            prefix = common_prefix(prefix, k)
            for v in vv:
                prefix = common_prefix(prefix, v)
        i = len(prefix)
        graph = {k[i:]: [v[i:] for v in vv] for k, vv in graph.items()}
        output.write(value2json(graph, pretty=True))


def common_prefix(a, b):
    for i, (p, kk) in enumerate(zip(a, b)):
        if p != kk:
            return a[:i]
    return a


if __name__ == "__main__":
    try:
        Finder(["~/code/django"]).scan(File("../django"), File("js/dependencies.json"))
    finally:
        stop_main_thread()
