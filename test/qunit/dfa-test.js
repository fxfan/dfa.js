var CharInput = xfan.dfa.CharInput;
var CharLabel = xfan.dfa.CharLabel;
var Edge = xfan.dfa.Edge;
var State = xfan.dfa.State;
var DFA = xfan.dfa.DFA;
var CharInputSequence = xfan.dfa.CharInputSequence;

test("CharInput#val()", function() {
  var input = new CharInput("a");
  equal(input.val(), "a");
});

test("CharInput.create(string)", function() {
  var inputs = CharInput.create("abc");
  equal(inputs.length, 3);
  equal(inputs[0].val(), "a");
  equal(inputs[1].val(), "b");
  equal(inputs[2].val(), "c");
});

test("CharLabel.Single#match(input)", function() {
  var label = new CharLabel.Single("a");
  ok(label.match(new CharInput("a")));
  ok(!label.match(new CharInput("b")));
});

test("CharLabel.Range#match(input)", function() {
  var label = new CharLabel.Range("c", "x");
  ok(!label.match(new CharInput("b")));
  ok(label.match(new CharInput("c")));
  ok(label.match(new CharInput("x")));
  ok(!label.match(new CharInput("y")));
});

test("CharLabel.Include#match(input)", function() {
  var label = new CharLabel.Include("246");
  ok(!label.match(new CharInput("1")));
  ok(label.match(new CharInput("2")));
  ok(!label.match(new CharInput("3")));
  ok(label.match(new CharInput("4")));
  ok(!label.match(new CharInput("5")));
});

test("CharLabel.Exclude#match(input)", function() {
  var label = new CharLabel.Exclude("246");
  ok(label.match(new CharInput("1")));
  ok(!label.match(new CharInput("2")));
  ok(label.match(new CharInput("3")));
  ok(!label.match(new CharInput("4")));
  ok(label.match(new CharInput("5")));
});

test("CharLabel.Or#match(input)", function() {
  var digit = new CharLabel.Range("0", "9");
  var zero = new CharLabel.Single("0");
  var abc = new CharLabel.Include("abc");
  var e = new CharLabel.Single("e");
  var label = new CharLabel.Or(digit, zero, abc, e);
  ok(label.match(new CharInput("0")));
  ok(label.match(new CharInput("9")));
  ok(label.match(new CharInput("a")));
  ok(!label.match(new CharInput("d")));
  ok(label.match(new CharInput("e")));
});

test("Edge#tryTransition(input,session)", function() {
  var a = new CharLabel.Single("a");
  var edge = new Edge(a, 2);
  equal(edge.tryTransition(new CharInput("a")), 2);
  deepEqual(edge.tryTransition(new CharInput("b")), null);
});

module('xfan.dfa.State', {
  setup : function() {
    a = new CharLabel.Single("a");
    edge = new Edge(a, 2);
  },
  teardown : function() {
  }
});

test("getAcceptedObject()", function() {
  var obj = {};
  var state = new State(1, [ edge ], obj);
  equal(state.getAcceptedObject(), obj);
});

test("getAcceptedObject() returns null for undefined", function() {
  var state = new State(1, [ edge ]);
  deepEqual(state.getAcceptedObject(), null);
});

test("isAcceptable() returns false when obj is null", function() {
  var state = new State(1, [ edge ], null);
  equal(state.isAcceptable(), false);
});

test("isAcceptable() returns false when obj is undefined", function() {
  var state = new State(1, [ edge ]);
  equal(state.isAcceptable(), false);
});

test("isAcceptable() returns true when obj is ''", function() {
  var state = new State(1, [ edge ], "");
  equal(state.isAcceptable(), true);
});

test("isAcceptable() returns true when obj is 0", function() {
  var state = new State(1, [ edge ], 0);
  equal(state.isAcceptable(), true);
});

test("isEdgeExists() returns false when edges is null", function() {
  var state = new State(1, null);
  equal(state.isEdgeExists(), false);
});

test("isEdgeExists() returns false when edges is undefined", function() {
  var state = new State(1);
  equal(state.isEdgeExists(), false);
});

test("isEdgeExists() returns false when edges is an empty array", function() {
  var state = new State(1, []);
  equal(state.isEdgeExists(), false);
});

test("isEdgeExists() returns true when edges is a non empty array", function() {
  var state = new State(1, [ edge ]);
  equal(state.isEdgeExists(), true);
});

// a state has two edges and the input matches second edge
// transit returns true and after that the current state equals with

// a state has two edges and the input doesnt match eny edge
// transit returns false and after that the current is still a state one.

module("xfan.dfa.DFA", {
  setup : function() {

    dfa = new DFA();
    obj = {};

    var edges = [];
    edges.push(new Edge(new CharLabel.Single("a"), 1));
    edges.push(new Edge(new CharLabel.Single("b"), 2));
    edges.push(new Edge(new CharLabel.Single("c"), 3));
    dfa.addStartState(new State(0, edges));

    // add a state where the edge with label "a" is linked to.
    // this state is not an accept one.
    state1 = new State(1, []);
    dfa.addState(state1);

    // add a state where the edge with label "b" is linked to.
    // this state is an accept one.
    state2 = new State(2, [], obj);
    dfa.addState(state2);

    // add a state where the edge with label "c" is linked to.
    // this state is not acceptable and has some edges.
    state3 = new State(3, edges);
    dfa.addState(state3);
  }
});

test("startNewTransition() successfully", function() {
  var trans = dfa.startNewTransition();
  ok(trans !== null);
  ok(trans instanceof xfan.dfa.Transition);
});

test("dfa without start state will fail to startNewTransition()", function() {
  throws(function() {
    new DFA().startNewTransition();
  }, /start state is not set/, "startNewTransition() should throw an error");
});

test("transit by inputing 'a'", function() {
  var trans = dfa.startNewTransition();
  ok(trans.transit(new CharInput("a")));
  equal(trans.current, state1);
  equal(trans.isAcceptable(), false);
  equal(trans.isEdgeExists(), false);
  throws(function() {
    trans.getAcceptedObject();
  }, /not an accept state/, "trans.getAcceptedObject() should throw an error");
});

test("transit by inputing 'b'", function() {
  var trans = dfa.startNewTransition();
  ok(trans.transit(new CharInput("b")));
  equal(trans.current, state2);
  equal(trans.isAcceptable(), true);
  equal(trans.isEdgeExists(), false);
  equal(trans.getAcceptedObject(), obj);
});

test("transit by inputing 'c'", function() {
  var trans = dfa.startNewTransition();
  ok(trans.transit(new CharInput("c")));
  equal(trans.current, state3);
  equal(trans.isAcceptable(), false);
  equal(trans.isEdgeExists(), true);
  throws(function() {
    trans.getAcceptedObject();
  }, /not an accept state/, "trans.getAcceptedObject() should throw an error");
});

module("CharInputSequence", {
  setup : function() {
    input = new CharInputSequence("hoge");
  }
});

test("get()", function() {
  equal(input.get().val(), "h");
  equal(input.get().val(), "o");
  equal(input.get().val(), "g");
  equal(input.get().val(), "e");
  equal(input.get(), null);
});

test("unget()", function() {

  // can't unget before calling get()
  throws(function() {
    input.unget();
  });

  // can unget after calling get()
  equal(input.get().val(), "h");
  input.unget();

  // can't unget twice even after calling get() twice
  equal(input.get().val(), "h");
  equal(input.get().val(), "o");
  input.unget();
  throws(function() {
    input.unget();
  });

  // can't unget after calling findLexis()
  equal(input.get().val(), "o");
  equal(input.findLexis(), "ho");
  throws(function() {
    input.unget();
  });
});

test("findLexis()", function() {

  // calling first will return ""
  equal(input.findLexis(), "");

  // returns a string you got before findLexis()
  equal(input.get().val(), "h");
  equal(input.get().val(), "o");
  equal(input.findLexis(), "ho");

  // calling in a row will return ""
  equal(input.findLexis(), "");

  // returns a string you got after previous findLexis() and before current
  // findLexis()
  equal(input.get().val(), "g");
  equal(input.get().val(), "e");
  equal(input.findLexis(), "ge");

  // returns "" when there is no more character can get
  equal(input.get(), null);
  equal(input.findLexis(), "");
});

test("hasNext()", function() {
  ok(input.hasNext());
  equal(input.get().val(), "h");
  ok(input.hasNext());
  equal(input.get().val(), "o");
  ok(input.hasNext());
  equal(input.get().val(), "g");
  ok(input.hasNext());
  equal(input.get().val(), "e");
  ok(!input.hasNext());
});
