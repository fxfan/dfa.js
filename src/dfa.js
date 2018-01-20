"use strict"

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
}

class CharLabel extends Label {

}

CharLabel.Single = class extends CharLabel {
  constructor(ch) {
    super();
    this.ch = ch;
    return Object.freeze(this);
  }
  match(input) {
    return input.val() === this.ch;
  }
}

CharLabel.Range = class extends CharLabel {
  constructor(first, end) {
    super();
    this.first = first;
    this.end = end;
    return Object.freeze(this);
  }
  match(input) {
    return input.val() >= this.first && input.val() <= this.end;
  }
}

CharLabel.Include = class extends CharLabel {
  constructor(chars) {
    super();
    this.chars = chars;
    return Object.freeze(this);
  }
  match(input) {
    return this.chars.includes(input.val());
  }
}

CharLabel.Exclude = class extends CharLabel {
  constructor(chars) {
    super();
    this.chars = chars;
    return Object.freeze(this);
  }
  match(input) {
    return !this.chars.includes(input.val());
  }
}

CharLabel.Or = class extends CharLabel {
  constructor() {
    super();
    this.labels = Object.freeze(Array.prototype.slice.call(arguments));
    return Object.freeze(this);
  }
  match(input) {
    return this.labels.some(l => l.match(input));
  }
}

class Edge {
  constructor(label, dest) {
    this.label = label;
    this.dest = dest;
    return Object.freeze(this);
  }
  tryTransition(input, session) {
    return this.label.match(input, session) ? this.dest : null;
  }
}

class State {

  constructor(num, edges, obj) {
    this.num = num;
    this.edges = Object.freeze(edges ? edges.slice() : []);
    this.obj = obj === undefined ? null : Object.freeze(obj);
    return Object.freeze(this);
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
}

class DFA {

  constructor() {
    this.start = null;
    this.states = {};
  }

  addStartState(state) {
    this.start = state;
    this.states[state.num] = state;
  }

  addState(state) {
    this.states[state.num] = state;
  }

  getStateByNum(num) {
    return this.states[num];
  }

  startNewTransition() {
    if (this.start === null) {
      throw "Start state isn't set";
    }
    return new Transition(this);
  }
}

class Transition {

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
  DFA : DFA,
  Transition : Transition,
  CharInputSequence : CharInputSequence,
  Token : Token,
  Parser : Parser
}
