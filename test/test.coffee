chai = require 'chai'
should = require 'should'
dfalib = require '../dfa'

assert = chai.assert
CharInput = dfalib.CharInput
CharLabel = dfalib.CharLabel

describe 'CharInput', ()->
  describe 'val()', ()->
    it 'should return the char which is passed to constructor', (done)->
      input = new CharInput 'a'
      assert.strictEqual input.val(), 'a'
      done()
  describe 'create(string)', ()->
    it 'should return an array of CharInputs', (done)->
      inputs = CharInput.create 'abc'
      assert.strictEqual inputs.length, 3
      assert.strictEqual inputs[0].val(), 'a'
      assert.strictEqual inputs[1].val(), 'b'
      assert.strictEqual inputs[2].val(), 'c'
      done()

describe 'CharLabel', ()->
  describe 'Single#match(input)', ()->
    it 'should only match the specified char', (done)->
      label = new CharLabel.Single 'a'
      assert.isOk label.match(new CharInput 'a')
      assert.isNotOk label.match(new CharInput 'b')
      done()
  describe 'Range#match(input)', ()->
    it 'should match the letters in the range', (done)->
      label = new CharLabel.Range 'c', 'e'
      assert.isNotOk label.match(new CharInput 'b')
      assert.isOk label.match(new CharInput 'c')
      assert.isOk label.match(new CharInput 'd')
      assert.isOk label.match(new CharInput 'e')
      assert.isNotOk label.match(new CharInput 'f')
      done()
  describe 'Include#match(input)', ()->
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
  describe 'Exclude#match(input)', ()->
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
  describe 'Or#match(input)', ()->
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
