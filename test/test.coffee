chai = require 'chai'
should = require 'should'
dfalib = require '../dfa'

assert = chai.assert
CharInput = dfalib.CharInput
CharLabel = dfalib.CharLabel
Edge = dfalib.Edge
State = dfalib.State
DFA = dfalib.DFA
CharInputSequence = dfalib.CharInputSequence


describe 'CharInput', ->
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


describe 'CharLabel', ->
  describe 'Single#match(input)', ->
    it 'should only match the specified char', (done)->
      label = new CharLabel.Single 'a'
      assert.isOk label.match(new CharInput 'a')
      assert.isNotOk label.match(new CharInput 'b')
      done()
  describe 'Range#match(input)', ->
    it 'should match the letters in the range', (done)->
      label = new CharLabel.Range 'c', 'e'
      assert.isNotOk label.match(new CharInput 'b')
      assert.isOk label.match(new CharInput 'c')
      assert.isOk label.match(new CharInput 'd')
      assert.isOk label.match(new CharInput 'e')
      assert.isNotOk label.match(new CharInput 'f')
      done()
  describe 'Include#match(input)', ->
    it 'should match the letters which the label includes', (done)->
      label = new CharLabel.Include '246'
      assert.isNotOk label.match(new CharInput '1')
      assert.isOk label.match(new CharInput '2')
      assert.isNotOk label.match(new CharInput '3')
      assert.isOk label.match(new CharInput '4')
      assert.isNotOk label.match(new CharInput '5')
      assert.isOk label.match(new CharInput '6')
      assert.isNotOk label.match(new CharInput '7')
      done()
  describe 'Exclude#match(input)', ->
    it 'should match the letters which the label doesnot exclude', (done)->
      label = new CharLabel.Exclude '246'
      assert.isOk label.match(new CharInput '1')
      assert.isNotOk label.match(new CharInput '2')
      assert.isOk label.match(new CharInput '3')
      assert.isNotOk label.match(new CharInput '4')
      assert.isOk label.match(new CharInput '5')
      assert.isNotOk label.match(new CharInput '6')
      assert.isOk label.match(new CharInput '7')
      done()
  describe 'Or#match(input)', ->
    it 'should match the letters which are matched one of specified labels', (done)->
      digit = new CharLabel.Range '0', '9'
      zero = new CharLabel.Single '0'
      abc = new CharLabel.Include 'abc'
      e = new CharLabel.Single 'e'
      label = new CharLabel.Or digit, zero, abc, e
      assert.isOk label.match(new CharInput '0')
      assert.isOk label.match(new CharInput '9')
      assert.isOk label.match(new CharInput 'a')
      assert.isNotOk label.match(new CharInput 'd')
      assert.isOk label.match(new CharInput 'e')
      done()


describe 'Edge', ->
  describe 'tryTransition(input,session)', ->
    it 'should succeed to transit for correct inputs', (done)->
      a = new CharLabel.Single 'a'
      edge = new Edge a, 2
      assert.strictEqual edge.tryTransition(new CharInput 'a'), 2
      assert.isNull edge.tryTransition(new CharInput 'b')
      done()


describe 'State', ->
  
  a = new CharLabel.Single 'a'
  edge = new Edge a, 2

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

  describe 'startNewTransition()', ->
    it 'should be done successfully', (done)->
      trans = dfa.startNewTransition()
      assert.isNotNull trans
      assert.instanceOf trans, dfalib.Transition
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

