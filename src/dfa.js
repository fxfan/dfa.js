"use strict"

Object.defineProperties(Array.prototype, {
  
  "__dfajs_flatten": {
    value: function() {
      return Array.prototype.concat.apply([], this);
    },
    enumerable: false
  },

  "__dfajs_uniq": {
    value: function() {
      return this.filter((e, i, self)=> self.indexOf(e) === i);
    },
    enumerable: false
  },

  "__dfajs_uniqAsString": {
    value: function() {
      return this.map(e => [e, e.toString()])
        .filter((tuple, i, self)=> self.findIndex(t => t[1] === tuple[1]) === i)
        .map(t => t[0]);
    },
    enumerable: false
  },

  "__dfajs_concatTo": {
    value: function(array) {
      return array.concat(this);
    },
    enumerable: false
  }

});


class Input {
  val() {
    throw "Input#val() must be implemented by subclasses";
  }
}

class CharInput extends Input {
  
  constructor(ch) {
    super();
    this.ch = ch;
    return Object.freeze(this);
  }

  val() {
    return this.ch;
  }

  static create(str) {
    return str.split("").map(c => new CharInput(c));
  }
}

class Label {
  match(input) {
    throw "Label#match(input) must be implemented by subclasses";
  }
  equals(label) {
    throw "Label#equals(label) must be implemented by subclasses";
  }
}

class Epsilon extends Label {
  match(input) {
    return false;
  }
  equals(label) {
    return this === label;
  }
  toString() {
    return "Label.E";
  }
}
Label.E = new Epsilon();

class CharLabel extends Label {

}

CharLabel.Single = class CharLabel_Single extends CharLabel {
  constructor(ch) {
    super();
    this.ch = ch;
    return Object.freeze(this);
  }
  match(input) {
    return input.val() === this.ch;
  }
  equals(label) {
    return this.constructor.name === label.constructor.name 
      && this.ch === label.ch;
  }
  toString() {
    return `CharLabel.Single[ch=${this.ch}]`;
  }
}

CharLabel.Range = class CharLabel_Range extends CharLabel {
  constructor(first, end) {
    super();
    this.first = first;
    this.end = end;
    return Object.freeze(this);
  }
  match(input) {
    return input.val() >= this.first && input.val() <= this.end;
  }
  equals(label) {
    return this.constructor.name === label.constructor.name 
      && this.first === label.first
      && this.end === label.end;
  }
  toString() {
    return `CharLabel.Range[first=${this.first},end=${this.end}]`;
  }
}

CharLabel.Include = class CharLabel_Include extends CharLabel {
  constructor(chars) {
    super();
    this.chars = chars;
    return Object.freeze(this);
  }
  match(input) {
    return this.chars.includes(input.val());
  }
  equals(label) {
    return this.constructor.name === label.constructor.name 
      && this.chars === label.chars;
  }
  toString() {
    return `CharLabel.Include[chars=${this.chars}]`;
  }
}

CharLabel.Exclude = class CharLabel_Exclude extends CharLabel {
  constructor(chars) {
    super();
    this.chars = chars;
    return Object.freeze(this);
  }
  match(input) {
    return !this.chars.includes(input.val());
  }
  equals(label) {
    return this.constructor.name === label.constructor.name 
      && this.chars === label.chars;
  }
  toString() {
    return `CharLabel.Exclude[chars=${this.chars}]`;
  }
}

CharLabel.Or = class CharLabel_Or extends CharLabel {
  constructor() {
    super();
    this.labels = Object.freeze(Array.prototype.slice.call(arguments).sort());
    return Object.freeze(this);
  }
  match(input) {
    return this.labels.some(l => l.match(input));
  }
  equals(label) {
    if (this.constructor.name !== label.constructor.name) {
      return false;
    }
    if (this.labels.length !== label.labels.length) {
      return false;
    }
    for (let i = 0; i < this.labels; i++) {
      if (!this.labels[i].match(label.labels[i])) {
        return false;
      }
    }
    return true;
  }
  toString() {
    return `CharLabel.Or[labels=${this.labels.join(',')}]`;
  }
}

class Edge {

  constructor(label, dest) {
    this.label = label;
    this.dest = dest;
    return Object.freeze(this);
  }
  
  hasSameLabelWith(edge) {
    return this.label.equals(edge.label);
  }

  tryTransition(input, session) {
    return this.label.match(input, session) ? this.dest : null;
  }

  changeDest(dest) {
    return new Edge(this.label, dest);
  }

  toString() {
    return `Edge(label=${this.label}, dest=${this.dest})`;
  }
}

class State {

  constructor(num, edges, obj) {
    this.num = num;
    this.edges = Object.freeze(edges ? edges.slice() : []);
    this.obj = obj === undefined ? null : Object.freeze(obj);
    return Object.freeze(this);
  }

  hasEpsilonMove() {
    return this.edges.some(e => e.label.equals(Label.E));
  }

  hasDuplicateEdge() {
    const set = new Set();
    this.edges.forEach(e => set.add(e.label.toString()));
    return set.size < this.edges.length;
  }

  getAcceptedObject() {
    return this.obj;
  }

  isAcceptable() {
    return this.obj !== null;
  }

  isEdgeExists() {
    return this.edges.length > 0;
  }

  addEdges(edges) {
    return new State(this.num, this.edges.concat(edges), this.obj);
  }

  changeEdgesDest(from, to) {
    if (this.edges.some(e => e.dest === from)) {
      return new State(this.num, this.edges.map(e => e.dest === from ? e.changeDest(to) : e), this.obj);
    } else {
      return this;
    }
  }

  toString() {
    return `State(num=${this.num}, edges=${this.edges}, obj=${this.obj})`;
  }
}

class StateNumSequence {

  static newSequence() {
    if (this.seed === undefined) {
      this.seed = 0;
    }
    return new StateNumSequence(++this.seed * 65536)
  }

  constructor(origin) {
    this.origin = origin;
    this.next = origin;
  }

  getNext() {
    if (this.next > this.origin + 65535) {
      throw `A sequence can only generate 65536 nums: ${this.origin} ~ ${this.origin + 65535}`;
    }
    return this.next++;
  }
}

class Fragment {

  constructor(states) {
    if (!Array.isArray(states) || states.length === 0) {
      throw "Parameter 'states' must be a non-empty array";
    }
    this.states = Object.freeze(states.slice());
    return Object.freeze(this);
  }

  get head() {
    return this.states[0];
  }

  get tail() {
    return this.states.slice(1);
  }

  get init() {
    return this.states.slice(0, -1);
  }

  get last() {
    return this.states[this.states.length - 1];
  }

  get headEdges() {
    return this.states[0].edges;
  }

  concat(o) {
    return new Fragment(this.init.concat(this.last.addEdges(o.headEdges)).concat(o.tail));
  }

  // Merges two Fragments.
  // The fragment created by merging accepts both inputs that are accepted by each fragments.
  // TODO: merging two fragments that have the same label on their first edges are not supported.
  merge(o) {
    const states = o.states.slice(1, -1).reduce((states, s)=> states.concat(s.changeEdgesDest(o.last.num, this.last.num)), this.init);
    states[0] = states[0].addEdges(o.headEdges);
    states.push(this.last);
    return new Fragment(states);
  }

  static concatAll(fragments) {
    fragments = fragments.slice();
    const first = fragments.shift();
    return fragments.reduce((base, frag)=> base.concat(frag), first);
  }

  static mergeAll(fragments) {
    fragments = fragments.slice();
    const first = fragments.shift();
    return fragments.reduce((base, frag)=> base.merge(frag), first);
  }
}

class NFA {

  constructor() {
    this.start = null;
    this.states = {};
  }

  addStartState(state) {
    this.addState(state);
    this.start = state;
  }

  addState(state) {
    this.states[state.num] = state;
  }

  getStateByNum(num, throwsMessage) {
    const state = this.states[num];
    if (state === undefined) {
      if (throwsMessage) {
        throw throwsMessage;
      }
      return null;
    }
    return state;
  }

  startNewTransition() {
    if (this.start === null) {
      throw "Start state isn't set";
    }
    return new NFATransition(this);
  }

  // Get a set of labels that are attached on the all edges in the NFA.
  getAllLabels() {
    return Object.keys(this.states)
      .map(n => this.states[n].edges.map(e => e.label).filter(l => l !== Label.E))
      .__dfajs_flatten()
      .__dfajs_uniqAsString();
  }
  
  // Get a set of states where the passed 'states' can move to through ϵ transition.
  eClosure(states) {
    const _eclosure = (state)=> state.edges
      .filter(e => e.label === Label.E)
      .map(e => _eclosure(this.getStateByNum(e.dest, `State ${e.dest}(linked from ${state.num}) not found`)))
      .__dfajs_flatten()
      .__dfajs_concatTo([state]);
    return Object.keys(states)
      .map(key => _eclosure(states[key]))
      .__dfajs_flatten()
      .__dfajs_uniq()
  }

  // Get a set of states where the passed 'states' can move to through edges with passed 'label'.
  move(states, label) {
    return states.reduce((nextStates, state)=> state.edges
      .filter(e => e.label.equals(label))
      .map(e => this.getStateByNum(e.dest, `State ${e.dest}(linked from ${state.num}) not found`))
      .__dfajs_concatTo(nextStates)
    , []).__dfajs_uniq()
  }
}

class NFATransition {

  constructor(nfa) {
    this.nfa = nfa;
    this.currents = nfa.eClosure([nfa.start]);
  }

  move(input) {
    this.currents = this.nfa.eClosure(this.currents.reduce((newCurrents, state)=> state.edges
      .map(e => e.tryTransition(input))
      .filter(dest => dest !== null)
      .map(dest => this.nfa.getStateByNum(dest, `State ${dest}(linked from ${state.num}) not found`))
      .__dfajs_concatTo(newCurrents)
    , []).__dfajs_uniq());
    return this.currents.length !== 0
  }

  isAcceptable() {
    return this.currents.some(s => s.isAcceptable());
  }

  isEdgeExists() {
    return this.currents.some(s => s.isEdgeExists());
  }

  getAcceptedObjects() {
    const objects = this.currents
      .filter(s => s.isAcceptable())
      .map(s => s.getAcceptedObject());
    if (objects.length === 0) {
      throw "current state is not acceptable";
    }
    return objects;
  }

  getCurrents() {
    return this.currents.slice();
  }
}

class DFA {

  constructor() {
    this.start = null;
    this.states = {};
  }

  addStartState(state) {
    this.addState(state);
    this.start = state;
  }

  addState(state) {
    if (state.hasEpsilonMove()) {
      throw "The state has e-move";
    }
    if (state.hasDuplicateEdge()) {
      throw "The state has duplicate edge";
    }
    this.states[state.num] = state;
  }

  getStateByNum(num) {
    return this.states[num] === undefined ? null : this.states[num];
  }

  appendFragment(fragment, stateNum) {
    const state = this.getStateByNum(stateNum);
    const newState = state.addEdges(fragment.headEdges);
    this.addState(newState);
    if (this.start === state) {
      this.start = newState;
    }
    fragment.tail.forEach(s => this.addState(s));
  }

  startNewTransition() {
    if (this.start === null) {
      throw "Start state isn't set";
    }
    return new DFATransition(this);
  }
}

class DFATransition {

  constructor(dfa) {
    this.dfa = dfa;
    this.current = dfa.start;
    this.session = {};
  }

  transit(input) {
    if (this.current === null) {
      throw "This transition has already failed due to illegal structure of the dfa";
    }
    const dest = this.current.edges
      .map(e => e.tryTransition(input, this.session))
      .find(dest => dest !== null)
    if (!dest) {
      return false;
    }
    this.current = this.dfa.states[dest];
    if (!this.current) {
      throw `Destination state '${dest}' is not found`;
    }
    return true;
  }

  isAcceptable() {
    return this.current.isAcceptable();
  }

  isEdgeExists() {
    return this.current.isEdgeExists();
  }

  getAcceptedObject() {
    if (!this.isAcceptable()) {
      throw "current state is not acceptable";
    }
    return this.current.getAcceptedObject();
  }
}

class CharInputSequence {

  constructor(str) {
    this.str = str;
    this.nextLexis = "";
    this.forwardingPointer = 0;
    this.enableUnget = false;
  }

  get() {
    if (!this.hasNext()) {
      return null;
    }
    const ch = this.str.charAt(this.forwardingPointer++);
    this.enableUnget = true;
    this.nextLexis += ch;
    return new CharInput(ch);
  }

  unget() {
    if (!this.enableUnget) {
      throw "Call get before unget";
    }
    this.enableUnget = false;
    this.forwardingPointer--;
    this.nextLexis = this.nextLexis.slice(0, -1);
  }

  findLexis() {
    this.enableUnget = false;
    const lexis = this.nextLexis;
    this.nextLexis = "";
    return lexis;
  }

  hasNext() {
    return this.forwardingPointer < this.str.length;
  }
}

class Token {
  constructor(lexis, obj) {
    this.lexis = lexis;
    this.obj = obj;
  }
}

class Parser {

  constructor(dfa, input) {
    this.dfa = dfa;
    this.input = input;
    this._next = null;
  }

  next() {
    if (this.hasNext()) {
      const tmp = this._next;
      this._next = null;
      return tmp;
    } else {
      return null;
    }
  }

  hasNext() {
    if (this._next !== null) {
      return true;
    }
    if (!this.input.hasNext()) {
      return false;
    }
    const trans = this.dfa.startNewTransition();
    let ch;
    while ((ch = this.input.get()) !== null) {
      if (trans.transit(ch)) {
        continue;
      } else {
        if (trans.isAcceptable()) {
          this.input.unget();
          const lexis = this.input.findLexis();
          this._next = new Token(lexis, trans.getAcceptedObject());
          return true;
        } else {
          throw `Parse error. near '${this.input.findLexis()}'`;
        }
      }
    }
    const lexis = this.input.findLexis();
    if (!trans.isAcceptable()) {
      throw `Parse error. near '${lexis}'`;
    }
    this._next = new Token(lexis, trans.getAcceptedObject());
    return true;
  }
}

module.exports = {
  Input : Input,
  CharInput : CharInput,
  Label : Label,
  CharLabel : CharLabel,
  Edge : Edge,
  State : State,
  Fragment: Fragment,
  NFA : NFA,
  DFA : DFA,
  CharInputSequence : CharInputSequence,
  Token : Token,
  Parser : Parser
}
