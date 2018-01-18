const dfalib = require("../dfa.js");

const CharLabel = dfalib.CharLabel;
const Edge = dfalib.Edge;
const State = dfalib.State;

const space = new CharLabel.Include(" \t\r\n");
const digit = new CharLabel.Range("0", "9");
const lower = new CharLabel.Range("a", "z");
const upper = new CharLabel.Range("A", "Z");
const letter = new CharLabel.Or(lower, upper);
const letterAndDigit = new CharLabel.Or(lower, upper, digit);
const e = new CharLabel.Include("Ee");
const sign = new CharLabel.Include("+-");

const dfa = new dfalib.DFA();

// initial state
let edges = [];
edges.push(new Edge(new CharLabel.Single("+"), 10));
edges.push(new Edge(new CharLabel.Single("-"), 20));
edges.push(new Edge(new CharLabel.Single("*"), 30));
edges.push(new Edge(new CharLabel.Single("/"), 40));
edges.push(new Edge(new CharLabel.Single("("), 50));
edges.push(new Edge(new CharLabel.Single(")"), 60));
edges.push(new Edge(digit, 70));
edges.push(new Edge(letter, 80));
edges.push(new Edge(space, 90));
dfa.addStartState(new State(1, edges));

// operators and brackets
dfa.addState(new State(10, [], "OP_ADD"));
dfa.addState(new State(20, [], "OP_SUBTRACT"));
dfa.addState(new State(30, [], "OP_MULTIPLY"));
dfa.addState(new State(40, [], "OP_DIVIDE"));
dfa.addState(new State(50, [], "BRACKET_OPEN"));
dfa.addState(new State(60, [], "BRACKET_CLOSE"));

// number literal /\d+(\.\d*)?((e|E)(+|-)?\d+)?/
edges = [];
edges.push(new Edge(digit, 70));
edges.push(new Edge(new CharLabel.Single("."), 71));
edges.push(new Edge(e, 72));
dfa.addState(new State(70, edges, "NUMBER_LITERAL"));

edges = [];
edges.push(new Edge(digit, 71));
edges.push(new Edge(e, 72));
dfa.addState(new State(71, edges, "NUMBER_LITERAL"));

edges = [];
edges.push(new Edge(sign, 73));
edges.push(new Edge(digit, 74));
dfa.addState(new State(72, edges));

edges = [];
edges.push(new Edge(digit, 74));
dfa.addState(new State(73, edges));

edges = [];
edges.push(new Edge(digit, 74));
dfa.addState(new State(74, edges, "NUMBER_LITERAL"));

// variable identifier /\w[\w\d]*/
edges = [];
edges.push(new Edge(letterAndDigit, 80));
dfa.addState(new State(80, edges, "VARIABLE"));

// white spaces /\s+/
edges = [];
edges.push(new Edge(space, 90));
dfa.addState(new State(90, edges, "WHITE_SPACE"));


// Tokenize the expression: '(12.3e+45 * x) / (67 + 89)'
const input = new dfalib.CharInputSequence("(12.3e+45 * x) / (67 + 89)");
const parser = new dfalib.Parser(dfa, input);
while (parser.hasNext()) {
  const token = parser.next();
  const msg = "Token is found: '" + token.lexis + "' [" + token.obj + "]";
  console.log(msg);
}
