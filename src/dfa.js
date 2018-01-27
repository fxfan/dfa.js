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

  constructor(num, edges = [], attrs = {}, acceptable = false, obj = null) {
    this.num = num;
    this.edges = Object.freeze(edges ? edges.slice() : []);
    this.attrs = Object.freeze(attrs ? Object.assign({}, attrs) : {});
    this.acceptable = !!acceptable;
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
    return this.acceptable;
  }

  isEdgeExists() {
    return this.edges.length > 0;
  }

  toAcceptable(obj = null) {
    return new State(this.num, this.edges, this.attrs, true, obj);
  }

  toUnacceptable() {
    return new State(this.num, this.edges, this.attrs, false, null);
  }

  addEdges(edges) {
    return new State(this.num, this.edges.concat(edges), this.attrs, this.acceptable, this.obj);
  }

  changeEdgesDest(from, to) {
    if (this.edges.some(e => e.dest === from)) {
      const newEdges = this.edges.map(e => e.dest === from ? e.changeDest(to) : e);
      return new State(this.num, newEdges, this.attrs, this.acceptable, this.obj);
    } else {
      return this;
    }
  }

  toString() {
    return `State(num=${this.num}, edges=${this.edges}, attrs=${this.attrs}, acceptable=${this.acceptable}, obj=${this.obj})`;
  }
}

class StateNumSequence {

  static newSequence() {
    if (this._seed === undefined) {
      this._seed = 0;
    }
    return new StateNumSequence(++this._seed * 65536)
  }

  constructor(origin) {
    this._origin = origin;
    this._next = origin;
  }

  next() {
    this._checkRange();
    return this._next++;
  }

  peek() {
    this._checkRange();
    return this._next;
  }

  _checkRange() {
    if (this._next > this._origin + 65535) {
      throw `A sequence can only generate 65536 nums: ${this._origin} ~ ${this._origin + 65535}`;
    }
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

  toUnacceptable() {
    return new Fragment(this.states.map(s => s.toUnacceptable()));
  }

  toLastAcceptable() {
    return new Fragment(this.init.concat(this.last.toAcceptable()));
  }

  concat(o) {
    return new Fragment(this.init.concat(this.last.addEdges(o.headEdges)).concat(o.tail));
  }

  // Merges two Fragments.
  // The fragment created by merging accepts both inputs that are accepted by each fragments.
  merge(o) {
    return Fragment.mergeAll([ this, o ]);
  }

  static concatAll(fragments) {
    fragments = fragments.slice();
    const first = fragments.shift();
    return fragments.reduce((base, frag)=> base.concat(frag), first);
  }

  static mergeAll(fragments) {

    const seq = StateNumSequence.newSequence();
    const head = new State(seq.next(), fragments.map(f => new Edge(Label.E, f.head.num)));
    const last = new State(seq.next(), []);

    const states = [ head]
      .concat(fragments.map(f => f.init.concat(f.last.addEdges([new Edge(Label.E, last.num)]))))
      .concat(last)
      .__dfajs_flatten()

    return new Fragment(states);
  }
}


class DTransRecord {

  constructor(num, states, edges) {
    this.num = num;
    this.states = Object.freeze(states.slice().sort((s1, s2)=> s1.num - s2.num));
    this.edges = Object.freeze(edges.slice());
    return Object.freeze(this);
  }

  getKey() {
    return DTransRecord.createKey(this.states);
  }

  addEdge(edge) {
    return new DTransRecord(this.num, this.states, this.edges.concat(edge));
  }

  static createKey(states) {
    return states.map(s => s.num).sort().toString();
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

  appendFragment(fragment, stateNum) {
    const state = this.getStateByNum(stateNum);
    const newState = state.addEdges([new Edge(Label.E, fragment.head.num)]);
    this.addState(newState);
    if (this.start === state) {
      this.start = newState;
    }
    fragment.states.forEach(s => this.addState(s));
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

  toDFA() {

    const seq = StateNumSequence.newSequence();
    const labels = this.getAllLabels();

    // Return a object in which a key is the string identifying a set of states 
    // and its value is a corresponding DTransRecord object.
    const _createTable = (states, table)=> {
      return labels.reduce((table, label)=> {
        const statesKey = DTransRecord.createKey(states);
        const destStates = this.eClosure(this.move(states, label));
        const destStatesKey = DTransRecord.createKey(destStates);
        if (table[destStatesKey]) {
          const edge = new Edge(label, table[destStatesKey].num);
          return Object.assign({}, table, { [statesKey]: table[statesKey].addEdge(edge) })
        } else {
          const newRecord = new DTransRecord(seq.next(), destStates, []);
          const edge = new Edge(label, newRecord.num);
          table = Object.assign({}, table, { 
            [statesKey]: table[statesKey].addEdge(edge), 
            [destStatesKey]: newRecord
          });
          return _createTable(destStates, table);
        }
      }, table)
    };

    const states = this.eClosure([this.start]);
    const record = new DTransRecord(seq.next(), states, []);
    const startKey = record.getKey();
    const table = _createTable(states, { [startKey]: record });

    return Object.keys(table).reduce((dfa, key)=> {
      const rec = table[key];
      const attrs = rec.states.reduce((attrs, s)=> {
        return Object.keys(s.attrs).reduce((attrs, key)=> {
          const values = (attrs[key] === undefined) ? [s.attrs[key]] : attrs[key].concat(s.attrs[key]);
          return Object.assign({}, attrs, { [key]: Object.freeze(values) });
        }, attrs);
      }, {});
      const acceptable = rec.states.some(s => s.isAcceptable());
      const objs = rec.states.filter(s => s.isAcceptable()).map(s => s.getAcceptedObject());
      // TODO: Ambiguous specification about how to handle multiple accepted objects
      const state = new State(rec.num, rec.edges, attrs, acceptable, objs.length > 0 ? objs[0] : null);
      if (key === startKey) {
        dfa.addStartState(state);
      } else {
        dfa.addState(state);
      }
      return dfa;
    }, new DFA());
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

  getAcceptedObject() {
    return this.getAcceptedObjects()[0];
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

  move(input) {
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
      if (trans.move(ch)) {
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

class Regex {

  constructor(expr) {
    this.expr = expr;
  }

  toFragment() {
    
    // Any special char is not supported yet.
    const seq = StateNumSequence.newSequence();
    const last = new State(seq.next(), []).toAcceptable(this.expr);

    const states = this.expr.split("").reduce((states, ch) => {
      const prevState = states[states.length - 1];
      const nextState = new State(seq.next(), []);
      const edge = new Edge(new CharLabel.Single(ch), nextState.num);
      states[states.length - 1] = prevState.addEdges([edge]);
      return states.concat(nextState)
    }, [ new State(seq.next(), []) ]);

    return new Fragment(
      states.slice(0, -1)
        .concat(states[states.length - 1].addEdges(new Edge(Label.E, last.num)))
        .concat(last)
    );
  }
}

module.exports = {
  Input : Input,
  CharInput : CharInput,
  Label : Label,
  CharLabel : CharLabel,
  Edge : Edge,
  State : State,
  StateNumSequence: StateNumSequence,
  Fragment: Fragment,
  NFA : NFA,
  DFA : DFA,
  CharInputSequence : CharInputSequence,
  Token : Token,
  Parser : Parser,
  Regex: Regex
}
