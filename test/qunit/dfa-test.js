var CharInput = xfan.dfa.CharInput;
var CharLabel = xfan.dfa.CharLabel;
var Edge = xfan.dfa.Edge;
var State = xfan.dfa.State;
var DFA = xfan.dfa.DFA;
var CharInputSequence = xfan.dfa.CharInputSequence;

// TODO: Move to test.coffee

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
