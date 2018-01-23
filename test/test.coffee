chai = require 'chai'
should = require 'should'
dfalib = require '../src/dfa.js'

assert = chai.assert
CharInput = dfalib.CharInput
CharLabel = dfalib.CharLabel
Label = dfalib.Label
Edge = dfalib.Edge
State = dfalib.State
Fragment = dfalib.Fragment
NFA = dfalib.NFA
DFA = dfalib.DFA
CharInputSequence = dfalib.CharInputSequence


describe 'CharInput', ->
  describe 'constructor()', ->
    it 'should return an immutable', (done)->
      input = new CharInput 'a'
      assert.throws -> input.ch = 'b'
      assert.strictEqual input.val(), 'a'
      done()
  describe 'val()', ->
    it 'should return the char which is passed to constructor', (done)->
      input = new CharInput 'a'
      assert.strictEqual input.val(), 'a'
      done()
  describe 'create(string)', ->
    it 'should return an array of CharInputs', (done)->
      inputs = CharInput.create 'abc'
      assert.strictEqual inputs.length, 3
      assert.strictEqual inputs[0].val(), 'a'
      assert.strictEqual inputs[1].val(), 'b'
      assert.strictEqual inputs[2].val(), 'c'
      done()


describe 'Label.E', ->
  e = Label.E;
  describe 'match(input)', ->
    it 'should return false for any inputs', (done)->
      assert.isFalse e.match new CharInput('e')
      done()
  describe 'equals(label)', ->
    it 'should return true when comparing to itself', (done)->
      assert.isTrue e.equals Label.E
      done()


class CharLabelSingleFake extends CharLabel
  constructor: (ch)->
    super()
    @ch = ch
    Object.freeze this
  match: (input)->
    input.val() == @ch;
  equals: (label)->
    @constructor.name == label.constructor.name && @ch == label.ch

describe 'CharLabel.Single', ->
  label = new CharLabel.Single 'a'
  describe 'constructor()', ->
    it 'should return an immutable', (done)->
      assert.throws -> label.ch = 'b'
      done()
  describe 'match(input)', ->
    it 'should only match the specified char', (done)->
      assert.isOk label.match(new CharInput 'a')
      assert.isNotOk label.match(new CharInput 'b')
      done()
  describe 'equals(label)', ->
    it 'should return true when comparing to another CharLabel.Single with the same ch', (done)->
      assert.isTrue label.equals new CharLabel.Single 'a'
      done()
    it 'should return false when comparing to another CharLabel.Single with a different ch', (done)->
      assert.isFalse label.equals new CharLabel.Single 'b'
      done()
    it 'should return false when comparing to an object of another class', (done)->
      assert.isFalse label.equals new CharLabelSingleFake 'a'
      done()


class CharLabelRangeFake extends CharLabel
  constructor: (first, end)->
    super()
    @first = first
    @end = end
    Object.freeze this
  match: (input)->
    input.val() >= @first && input.val() <= @end;
  equals: (label)->
    @constructor.name == label.constructor.name && @first == label.first && @end == label.end;

describe 'CharLabel.Range', ->
  label = new CharLabel.Range 'c', 'e'
  describe 'constructor(first, end)', ->
    it 'should return an immutable', (done)->
      assert.throws -> label.first = 'f'
      assert.throws -> label.end = 'g'
      done()
  describe 'match(input)', ->
    it 'should match the letters in the range', (done)->
      assert.isNotOk label.match(new CharInput 'b')
      assert.isOk label.match(new CharInput 'c')
      assert.isOk label.match(new CharInput 'd')
      assert.isOk label.match(new CharInput 'e')
      assert.isNotOk label.match(new CharInput 'f')
      done()
  describe 'equals(label)', ->
    it 'should return true when comparing to another CharLabel.Range with the same first and end', (done)->
      assert.isTrue label.equals new CharLabel.Range 'c', 'e'
      done()
    it 'should return false when comparing to another CharLabel.Range with a different first or end', (done)->
      assert.isFalse label.equals new CharLabel.Range 'c', 'f'
      done()
    it 'should return false when comparing to an object of another class', (done)->
      assert.isFalse label.equals new CharLabelRangeFake 'c', 'e'
      done()


describe 'CharLabel.Include', ->
  label = new CharLabel.Include '246'
  describe 'constructor(chars)', ->
    it 'should return an immutable', (done)->
      assert.throws -> label.chars = '135'
      done()
  describe 'match(input)', ->
    it 'should match the letters which the label includes', (done)->
      assert.isNotOk label.match(new CharInput '1')
      assert.isOk label.match(new CharInput '2')
      assert.isNotOk label.match(new CharInput '3')
      assert.isOk label.match(new CharInput '4')
      assert.isNotOk label.match(new CharInput '5')
      assert.isOk label.match(new CharInput '6')
      assert.isNotOk label.match(new CharInput '7')
      done()
  describe 'equals(label)', ->
    it 'should return true when comparing to another CharLabel.Include with the same chars', (done)->
      assert.isTrue label.equals new CharLabel.Include '246'
      done()
    it 'should return false when comparing to another CharLabel.Include with a different chars', (done)->
      assert.isFalse label.equals new CharLabel.Include '245'
      done()
    it 'should return false when comparing to an object of another class', (done)->
      assert.isFalse label.equals new CharLabel.Exclude '246'
      done()


describe 'CharLabel.Exclude', ->
  label = new CharLabel.Exclude '246'
  describe 'constructor(chars)', ->
    it 'should return an immutable', (done)->
      assert.throws -> label.chars = '135'
      done()
  describe 'match(input)', ->
    it 'should match the letters which the label doesnot exclude', (done)->
      assert.isOk label.match(new CharInput '1')
      assert.isNotOk label.match(new CharInput '2')
      assert.isOk label.match(new CharInput '3')
      assert.isNotOk label.match(new CharInput '4')
      assert.isOk label.match(new CharInput '5')
      assert.isNotOk label.match(new CharInput '6')
      assert.isOk label.match(new CharInput '7')
      done()
  describe 'equals(label)', ->
    it 'should return true when comparing to another CharLabel.Exclude with the same chars', (done)->
      assert.isTrue label.equals new CharLabel.Exclude '246'
      done()
    it 'should return false when comparing to another CharLabel.Exclude with a different chars', (done)->
      assert.isFalse label.equals new CharLabel.Exclude '245'
      done()
    it 'should return false when comparing to an object of another class', (done)->
      assert.isFalse label.equals new CharLabel.Include '246'
      done()


describe 'CharLabel.Or', ->
  digit = new CharLabel.Range '0', '9'
  zero = new CharLabel.Single '0'
  abc = new CharLabel.Include 'abc'
  e = new CharLabel.Single 'e'
  label = new CharLabel.Or digit, zero, abc, e
  describe 'constructor(chars)', ->
    it 'should return an immutable', (done)->
      assert.throws -> label.labels = []
      assert.throws -> label.labels.push(new CharLabel.Single '-')
      done()
  describe 'match(input)', ->
    it 'should match the letters which are matched one of specified labels', (done)->
      assert.isOk label.match(new CharInput '0')
      assert.isOk label.match(new CharInput '9')
      assert.isOk label.match(new CharInput 'a')
      assert.isNotOk label.match(new CharInput 'd')
      assert.isOk label.match(new CharInput 'e')
      done()
  describe 'equals(label)', ->
    it 'should return true when comparing to another CharLabel.Exclude with the same labels', (done)->
      assert.isTrue label.equals new CharLabel.Or digit, zero, abc, e
      done()
    it 'should return false when comparing to another CharLabel.Exclude with a different labels', (done)->
      assert.isFalse label.equals new CharLabel.Or digit, zero, abc
      done()
    it 'should return false when comparing to an object of another class', (done)->
      assert.isFalse label.equals new CharLabel.Include '246'
      done()


describe 'Edge', ->
  a = new CharLabel.Single 'a'
  edge = new Edge a, 2
  describe 'constructor(label, dest)', ->
    it 'should return an immutable', (done)->
      assert.throws -> edge.labe = new CharLabel.Single 'b'
      assert.throws -> edge.dest = 3
      done()
  describe 'hasSameLabelWith(edge)', ->
    it 'should return true if "edge" has the same label', (done)->
      assert.isTrue edge.hasSameLabelWith new Edge(new CharLabel.Single('a'), 4)
      done();
    it 'should return false if "edge" has a different label', (done)->
      assert.isFalse edge.hasSameLabelWith new Edge(new CharLabel.Single('b'), 2)
      done();
  describe 'tryTransition(input,session)', ->
    it 'should succeed to transit for correct inputs', (done)->
      assert.strictEqual edge.tryTransition(new CharInput 'a'), 2
      assert.isNull edge.tryTransition(new CharInput 'b')
      done()


describe 'State', ->
  
  a = new CharLabel.Single 'a'
  edge = new Edge a, 2

  describe 'constructor(num, edges, obj)', ->
    it 'should return an immutable', (done)->
      state = new State 1, [ edge ], { name: 'hoge' }
      assert.throws -> state.num = 2
      assert.throws -> state.edges = []
      assert.throws -> state.edges.push new Edge new CharLabel.Single('b'), 3
      assert.throws -> state.obj = { name: 'piyo' }
      assert.throws -> state.obj.name = 'piyo'
      done()
  describe 'hasEpsilonMove()', =>
    it 'should return the value indicates if the state has edges with Label.E', (done)->
      e1 = new Edge(new CharLabel.Single('a'), 2)
      e2 = new Edge(Label.E, 4)
      assert.isTrue (new State 1, [ e1, e2 ]).hasEpsilonMove()
      assert.isTrue (new State 1, [ e2 ]).hasEpsilonMove()
      assert.isFalse (new State 1, [ e1 ]).hasEpsilonMove()
      done()
  describe 'hasDuplicateEdge()', =>
    it 'should return the value indicates if the state has edges with the same label', (done)->
      e1 = new Edge(new CharLabel.Single('a'), 2)
      e2 = new Edge(new CharLabel.Single('a'), 4)
      e3 = new Edge(new CharLabel.Single('b'), 2)
      assert.isTrue (new State 1, [ e1, e2, e3 ]).hasDuplicateEdge()
      assert.isTrue (new State 1, [ e1, e2 ]).hasDuplicateEdge()
      assert.isFalse (new State 1, [ e1, e3 ]).hasDuplicateEdge()
      done()
  describe 'getAcceptedObject()', ->
    it 'should return accepted object', (done)->
      obj = {}
      state = new State 1, [ edge ], obj
      assert.strictEqual state.getAcceptedObject(), obj
      done()
    it 'should return null for undefined', (done)->
      state = new State 1, [ edge ]
      assert.isNull state.getAcceptedObject()
      done()
  describe 'isAcceptable()', ->
    it 'should return false when obj is null', (done)->
      state = new State 1, [ edge ], null
      assert.isFalse state.isAcceptable()
      done()
    it 'should return false when obj is undefined', (done)->
      state = new State 1, [ edge ]
      assert.isFalse state.isAcceptable()
      done()
    it 'should return true when obj is ""', (done)->
      state = new State 1, [ edge ], ''
      assert.isTrue state.isAcceptable()
      done()
    it 'should return true when obj is 0', (done)->
      state = new State 1, [ edge ], 0
      assert.isTrue state.isAcceptable()
      done()
  describe 'isEdgeExists()', ->
    it 'should return false when edges is null', (done)->
      state = new State 1, null
      assert.isFalse state.isEdgeExists()
      done()
    it 'should return false when edges is undefined', (done)->
      state = new State 1
      assert.isFalse state.isEdgeExists()
      done()
    it 'should return false when edges is an empty array', (done)->
      state = new State 1, []
      assert.isFalse state.isEdgeExists()
      done()
    it 'should return true when edges is a non empty array', (done)->
      state = new State 1, [ edge ]
      assert.isTrue state.isEdgeExists()
      done()


describe 'NFA', ->

  # Regular expression: (a|b)*a
  nfa = new NFA()
  nfa.addStartState new State 0, [
    new Edge(Label.E, 1)
    new Edge(Label.E, 7)
  ]
  nfa.addState new State 1, [
    new Edge(Label.E, 2)
    new Edge(Label.E, 4)
  ]
  nfa.addState new State 2, [
    new Edge(new CharLabel.Single('a'), 3)
  ]
  nfa.addState new State 3, [
    new Edge(Label.E, 6)
  ]
  nfa.addState new State 4, [
    new Edge(new CharLabel.Single('b'), 5)
  ]
  nfa.addState new State 5, [
    new Edge(Label.E, 6)
  ]
  nfa.addState new State 6, [
    new Edge(Label.E, 1)
    new Edge(Label.E, 7)
  ]
  nfa.addState new State 7, [
    new Edge(new CharLabel.Single('a'), 8)
  ]
  nfa.addState new State 8, [], 'OK!'

  describe 'getAllLabels()', ->
    it 'should return all labels in NFA except duplicates and Label.E', (done)->
      labels = nfa.getAllLabels()
      assert.strictEqual labels.length, 2
      assert.isTrue labels[0].match(new CharInput('a'))
      assert.isTrue labels[1].match(new CharInput('b'))
      done()
  describe 'eClosure(states)', ->
    it 'should move through ε transition recursively', (done)->
      states = [
        nfa.getStateByNum 0
      ]
      nexts = nfa.eClosure states
      assert.strictEqual nexts.length, 5
      assert.isTrue nexts.some((s)-> s.num == 0)
      assert.isTrue nexts.some((s)-> s.num == 1)
      assert.isTrue nexts.some((s)-> s.num == 2)
      assert.isTrue nexts.some((s)-> s.num == 4)
      assert.isTrue nexts.some((s)-> s.num == 7)
      done()
    it 'should exclude duplicate states', (done)->
      states = [
        nfa.getStateByNum 1
        nfa.getStateByNum 3
        nfa.getStateByNum 5
      ]
      nexts = nfa.eClosure states
      assert.strictEqual nexts.length, 7
      assert.isTrue nexts.some((s)-> s.num == 1)
      assert.isTrue nexts.some((s)-> s.num == 2)
      assert.isTrue nexts.some((s)-> s.num == 3)
      assert.isTrue nexts.some((s)-> s.num == 4)
      assert.isTrue nexts.some((s)-> s.num == 5)
      assert.isTrue nexts.some((s)-> s.num == 6)
      assert.isTrue nexts.some((s)-> s.num == 7)
      done()
    it 'should not move through non-ε transition', (done)->
      states = [
        nfa.getStateByNum 2
        nfa.getStateByNum 4
      ]
      nexts = nfa.eClosure states
      assert.strictEqual nexts.length, 2
      assert.isTrue nexts.some((s)-> s.num == 2)
      assert.isTrue nexts.some((s)-> s.num == 4)
      done()
  describe 'move(states, label)', ->
    it 'should move throught an edge with the specified label', (done)->
      states = [
        nfa.getStateByNum 2
        nfa.getStateByNum 4
      ]
      nexts = nfa.move states, new CharLabel.Single('a')
      assert.strictEqual nexts.length, 1
      assert.isTrue nexts.some((s)-> s.num == 3)
      done()
    it 'should move throught multiple edges with the specified label', (done)->
      states = [
        nfa.getStateByNum 2
        nfa.getStateByNum 7
      ]
      nexts = nfa.move states, new CharLabel.Single('a')
      assert.strictEqual nexts.length, 2
      assert.isTrue nexts.some((s)-> s.num == 3)
      assert.isTrue nexts.some((s)-> s.num == 8)
      done()
    it 'should not move throught ε transition', (done)->
      states = [
        nfa.getStateByNum 1
      ]
      nexts = nfa.move states, new CharLabel.Single('a')
      assert.strictEqual nexts.length, 0
      done()
  describe 'startNewTransition()', ->
    it 'should be done successfully', (done)->
      trans = nfa.startNewTransition()
      assert.isNotNull trans
      assert.strictEqual trans.constructor.name, 'NFATransition'
      done()
    it 'should fail without start state in the NFA', (done)->
      assert.throws -> new NFA().startNewTransition()
      done()
  describe 'Transition#move(input)', ->
    trans = nfa.startNewTransition()
    it 'should move with input "b"', (done)->
      assert.isTrue trans.move new CharInput('b')
      assert.strictEqual trans.currents.length, 6
      assert.isTrue trans.currents.some((s)-> s.num == 1)
      assert.isTrue trans.currents.some((s)-> s.num == 2)
      assert.isTrue trans.currents.some((s)-> s.num == 4)
      assert.isTrue trans.currents.some((s)-> s.num == 5)
      assert.isTrue trans.currents.some((s)-> s.num == 6)
      assert.isTrue trans.currents.some((s)-> s.num == 7)
      assert.isFalse trans.isAcceptable()
      assert.isTrue trans.isEdgeExists()
      assert.throws ->
        trans.getAcceptedObjects()
      , /is not acceptable/
      done()
    it 'should move with input "a"(acceptable)', (done)->
      assert.isTrue trans.move new CharInput('a')
      assert.strictEqual trans.currents.length, 7
      assert.isTrue trans.currents.some((s)-> s.num == 1)
      assert.isTrue trans.currents.some((s)-> s.num == 2)
      assert.isTrue trans.currents.some((s)-> s.num == 3)
      assert.isTrue trans.currents.some((s)-> s.num == 4)
      assert.isTrue trans.currents.some((s)-> s.num == 6)
      assert.isTrue trans.currents.some((s)-> s.num == 7)
      assert.isTrue trans.currents.some((s)-> s.num == 8)
      assert.isTrue trans.isAcceptable()
      assert.isTrue trans.isEdgeExists()
      assert.strictEqual trans.getAcceptedObjects().length, 1
      assert.isTrue trans.getAcceptedObjects().some((o)-> o == 'OK!')
      done()
    it 'should move with input "b" again(not acceptable)', (done)->
      assert.isTrue trans.move new CharInput('b')
      assert.strictEqual trans.currents.length, 6
      assert.isTrue trans.currents.some((s)-> s.num == 1)
      assert.isTrue trans.currents.some((s)-> s.num == 2)
      assert.isTrue trans.currents.some((s)-> s.num == 4)
      assert.isTrue trans.currents.some((s)-> s.num == 5)
      assert.isTrue trans.currents.some((s)-> s.num == 6)
      assert.isTrue trans.currents.some((s)-> s.num == 7)
      assert.isFalse trans.isAcceptable()
      assert.isTrue trans.isEdgeExists()
      assert.throws ->
        trans.getAcceptedObjects()
      , /is not acceptable/
      done()


describe 'DFA', ->

  dfa = new DFA()
  obj = {}
  edges = [
    new Edge(new CharLabel.Single('a'), 1)
    new Edge(new CharLabel.Single('b'), 2)
    new Edge(new CharLabel.Single('c'), 3)
  ]
  dfa.addStartState new State(0, edges)

  # add a state where the edge with label "a" is linked to.
  # this state is not acceptable.
  state1 = new State 1, []
  dfa.addState state1;

  # add a state where the edge with label "b" is linked to.
  # this state is acceptable.
  state2 = new State 2, [], obj
  dfa.addState state2

  # add a state where the edge with label "c" is linked to.
  # this state is not acceptable and has some edges.
  state3 = new State 3, edges
  dfa.addState state3

  describe 'addStartState(state)', ->
    it 'should add the state as the start state', (done)->
      d = new DFA()
      assert.doesNotThrow -> d.addStartState new State(1, edges)
      assert.isNotNull d.getStateByNum(1)
      assert.strictEqual d.start.num, 1
      done()
  describe 'addState(state)', ->
    it 'should add the state', (done)->
      d = new DFA()
      assert.doesNotThrow -> d.addState new State(1, edges)
      assert.isNotNull d.getStateByNum(1)
      done()
    it 'should throw an error if the state has e-move', (done)->
      e = new Edge(Label.E, 3)
      d = new DFA()
      assert.throws -> d.addState new State(1, [e])
      assert.isNull d.getStateByNum(1)
      done()
    it 'should throw an error if the state has duplicate edges', (done)->
      e1 = new Edge(new CharLabel.Single('a'), 3)
      e2 = new Edge(new CharLabel.Single('a'), 4)
      d = new DFA()
      assert.throws -> d.addState new State(1, [e1, e2])
      assert.isNull d.getStateByNum(1)
      done()
  describe 'appendFragment(fragment, stateNum)', ->
    frag = new Fragment [
      new State(100, [ new Edge new CharLabel.Single('h'), 101 ])
      new State(101, [ new Edge new CharLabel.Single('i'), 102 ])
      new State(102, [], 'HI!')
    ]
    hi = new DFA()
    hi.addStartState new State(0)
    hi.appendFragment frag, 0
    it 'should append all states except the head to dfa and replace the start state', (done)->
      assert.strictEqual hi.start.num, 0
      assert.isNotNull hi.getStateByNum(0)
      assert.isNotNull hi.getStateByNum(101)
      assert.isNotNull hi.getStateByNum(102)
      assert.isTrue hi.start.edges[0].label.match(new CharInput 'h')
      trans = hi.startNewTransition()
      assert.strictEqual trans.current, hi.start
      assert.isTrue trans.transit new CharInput('h')
      assert.isTrue trans.transit new CharInput('i')
      assert.isTrue trans.isAcceptable()
      assert.isFalse trans.isEdgeExists()
      assert.strictEqual trans.getAcceptedObject(), 'HI!'
      done()
  describe 'startNewTransition()', ->
    it 'should be done successfully', (done)->
      trans = dfa.startNewTransition()
      assert.isNotNull trans
      assert.strictEqual trans.constructor.name, 'DFATransition'
      done()
    it 'should fail without start state in the DFA', (done)->
      assert.throws -> new DFA().startNewTransition()
      done()
  describe 'Transition#transit(input)', ->
    it 'should transit to state1 with input "a"', (done)->
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('a')
      assert.strictEqual trans.current, state1
      assert.isFalse trans.isAcceptable()
      assert.isFalse trans.isEdgeExists()
      assert.throws ->
        trans.getAcceptedObject()
      , /is not acceptable/
      done()
    it 'should transit to state2 with input "b"', (done)->
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('b')
      assert.strictEqual trans.current, state2
      assert.isTrue trans.isAcceptable()
      assert.isFalse trans.isEdgeExists()
      assert.strictEqual trans.getAcceptedObject(), obj
      done()
    it 'should transit to state3 with input "c"', (done)->
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('c')
      assert.strictEqual trans.current, state3
      assert.isFalse trans.isAcceptable()
      assert.isTrue trans.isEdgeExists()
      assert.throws ->
        trans.getAcceptedObject()
      , /is not acceptable/
      done()


describe 'Fragment', ->

  ho = new Fragment([
    new State(100, [ new Edge new CharLabel.Single('h'), 101 ])
    new State(101, [ new Edge new CharLabel.Single('o'), 102 ])
    new State(102, [], 'HO!')
  ]);

  ge = new Fragment([
    new State(200, [ new Edge new CharLabel.Single('g'), 201 ])
    new State(201, [ new Edge new CharLabel.Single('e'), 202 ])
    new State(202, [], 'GE!')
  ]);

  pi = new Fragment([
    new State(300, [ new Edge new CharLabel.Single('p'), 301 ])
    new State(301, [ new Edge new CharLabel.Single('i'), 302 ])
    new State(302, [], 'PI!')
  ]);

  describe 'constructor(states)', ->
    it 'should return an immutable', (done)->
      assert.throws -> ho.states = []
      assert.throws -> ho.states.push new State(300)
      done()
  describe 'head', ->
    it 'should return the first element of states', (done)->
      assert.strictEqual ho.head.num, 100
      done()
  describe 'tail', ->
    it 'should return all states except the first', (done)->
      assert.strictEqual ho.tail.length, 2
      assert.strictEqual ho.tail[0].num, 101
      assert.strictEqual ho.tail[1].num, 102
      done()
  describe 'init', ->
    it 'should return all states except the last', (done)->
      assert.strictEqual ho.init.length, 2
      assert.strictEqual ho.init[0].num, 100
      assert.strictEqual ho.init[1].num, 101
      done()
  describe 'last', ->
    it 'should return the last element of states', (done)->
      assert.strictEqual ho.last.num, 102
      done()
  describe 'concat', ->
    frag = ho.concat ge
    dfa = new DFA()
    dfa.addStartState new State(0)
    dfa.appendFragment frag, 0
    it 'should return new Fragment that accepts inputs "hoge"', (done)->
      assert.strictEqual frag.head, ho.head
      assert.strictEqual frag.last, ge.last
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('h')
      assert.isTrue trans.transit new CharInput('o')
      assert.isTrue trans.transit new CharInput('g')
      assert.isTrue trans.transit new CharInput('e')
      assert.isTrue trans.isAcceptable()
      assert.isFalse trans.isEdgeExists()
      assert.strictEqual trans.getAcceptedObject(), 'GE!'
      done()
  describe 'merge', ->
    frag = ho.merge ge
    dfa = new DFA()
    dfa.addStartState new State(0)
    dfa.appendFragment frag, 0
    it 'should return new Fragment that accepts inputs "ho" or "ge"', (done)->
      assert.strictEqual frag.head.num, ho.head.num
      assert.strictEqual frag.last, ho.last
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('h')
      assert.isTrue trans.transit new CharInput('o')
      assert.isTrue trans.isAcceptable()
      assert.isFalse trans.isEdgeExists()
      assert.strictEqual trans.getAcceptedObject(), 'HO!'
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('g')
      assert.isTrue trans.transit new CharInput('e')
      assert.isTrue trans.isAcceptable()
      assert.isFalse trans.isEdgeExists()
      assert.strictEqual trans.getAcceptedObject(), 'HO!'
      done()
  describe 'concatAll', ->
    frag = Fragment.concatAll [ho, ge, pi]
    dfa = new DFA()
    dfa.addStartState new State(0)
    dfa.appendFragment frag, 0
    it 'should return new Fragment that accepts inputs "hogepi"', (done)->
      assert.strictEqual frag.head, ho.head
      assert.strictEqual frag.last, pi.last
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('h')
      assert.isTrue trans.transit new CharInput('o')
      assert.isTrue trans.transit new CharInput('g')
      assert.isTrue trans.transit new CharInput('e')
      assert.isTrue trans.transit new CharInput('p')
      assert.isTrue trans.transit new CharInput('i')
      assert.isTrue trans.isAcceptable()
      assert.isFalse trans.isEdgeExists()
      assert.strictEqual trans.getAcceptedObject(), 'PI!'
      done()
  describe 'mergeAll', ->
    frag = Fragment.mergeAll [ho, ge, pi]
    dfa = new DFA()
    dfa.addStartState new State(0)
    dfa.appendFragment frag, 0
    it 'should return new Fragment that accepts inputs "ho" or "ge" or "pi"', (done)->
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('h')
      assert.isTrue trans.transit new CharInput('o')
      assert.strictEqual trans.getAcceptedObject(), 'HO!'
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('g')
      assert.isTrue trans.transit new CharInput('e')
      assert.strictEqual trans.getAcceptedObject(), 'HO!'
      trans = dfa.startNewTransition()
      assert.isTrue trans.transit new CharInput('p')
      assert.isTrue trans.transit new CharInput('i')
      assert.strictEqual trans.getAcceptedObject(), 'HO!'
      done()


describe 'CharInputSequence', ->
  
  describe 'get()', ->
    input = new CharInputSequence 'hoge'
    it 'should get character sequentially', (done)->
      assert.strictEqual input.get().val(), 'h'
      assert.strictEqual input.get().val(), 'o'
      assert.strictEqual input.get().val(), 'g'
      assert.strictEqual input.get().val(), 'e'
      assert.isNull input.get()
      done()
  describe 'unget()', ->
    input = new CharInputSequence 'hoge'
    it 'should throw error without calling get()', (done)->
      assert.throws -> input.unget()
      done()
    it 'should be done successfully after calling get()', (done)->
      assert.strictEqual input.get().val(), 'h'
      assert.doesNotThrow -> input.unget()
      assert.strictEqual input.get().val(), 'h'
      done()
    it 'should throw an error when it is called twice in a row', (done)->
      assert.strictEqual input.get().val(), 'o'
      assert.doesNotThrow -> input.unget()
      assert.throws -> input.unget()
      done()
    it 'should throw an error when it is called after calling findLexis()', (done)->
      assert.strictEqual input.get().val(), 'o'
      assert.strictEqual input.findLexis(), 'ho'
      assert.throws -> input.unget()
      done()
  describe 'findLexis()', ->
    input = new CharInputSequence 'hoge'
    it 'should return an empty string when it is called first', (done)->
      assert.strictEqual input.findLexis(), ''
      done()
    it 'should return a string you got with get() before', (done)->
      assert.strictEqual input.get().val(), 'h'
      assert.strictEqual input.get().val(), 'o'
      assert.strictEqual input.findLexis(), 'ho'
      done()
    it 'should return an empty string when it is called twice in a row', (done)->
      assert.strictEqual input.findLexis(), ''
      done()
    it 'should return a string you got with get() after previous findLexis() and before current findLexis()', (done)->
      assert.strictEqual input.get().val(), 'g'
      assert.strictEqual input.get().val(), 'e'
      assert.strictEqual input.findLexis(), 'ge'
      done()
    it 'should return an empty string when there is no more character can get', (done)->
      assert.isNull input.get()
      assert.strictEqual input.findLexis(), ''
      done()
  describe 'hasNext()', ->
    input = new CharInputSequence 'hoge'
    it 'should return if the source has more inputs', (done)->
      assert.isTrue input.hasNext()
      assert.strictEqual input.get().val(), 'h'
      assert.isTrue input.hasNext()
      assert.strictEqual input.get().val(), 'o'
      assert.isTrue input.hasNext()
      assert.strictEqual input.get().val(), 'g'
      assert.isTrue input.hasNext()
      assert.strictEqual input.get().val(), 'e'
      assert.isFalse input.hasNext()
      done()

