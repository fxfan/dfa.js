/*! xfan.dfa - v0.1.0 - 2012-12-06
* https://github.com/fxfan/dfa.js
* Copyright (c) 2012 xfan; Licensed MIT */

var xfan = xfan || {};

(function() {

  "use strict";

  var _extend = function() {
    var dest = Array.prototype.shift.apply(arguments);
    for ( var i = 0; i < arguments.length; i++) {
      for ( var prop in arguments[i]) {
        dest[prop] = arguments[i][prop];
      }
    }
    return dest;
  };

  var Class = {};
  Class.create = (function() {
    var proto = {
      extend : (function() {
        var F = function() {
        };
        return function(uber) {
          F.prototype = uber.prototype;
          this.prototype = new F();
          this.uber = uber.prototype;
          this.prototype.constructor = this;
          return this;
        };
      })(),
      define : function(props) {
        _extend(this.prototype, props);
        return this;
      },
      defineStatic : function(props) {
        _extend(this, props);
        return this;
      }
    };
    return function(name) {
      var def = "(function " + name.replace(/\./g, "_") + "() {";
      def += "this.className = name;";
      def += "if (this.initialize) { this.initialize.apply(this, arguments); }";
      def += "})";
      var C = eval(def);
      C.__proto__ = proto;
      return C;
    };
  })();

  var Input = Class.create("Input").define({
    val : function() {
      throw "Input#val() method must be implemented by subclass";
    }
  });

  var CharInput = Class.create("CharInput").extend(Input).define({
    initialize : function(ch) {
      this.ch = ch;
    },
    val : function() {
      return this.ch;
    }
  }).defineStatic({
    create : function(str) {
      var inputs = [];
      for ( var i = 0; i < str.length; i++) {
        inputs.push(new this(str.charAt(i)));
      }
      return inputs;
    }
  });

  var Label = Class.create("Label").define({
    match : function(input) {
      throw "Label#match(input) method must be implemented by subclass";
    }
  });

  var CharLabel = Class.create("CharLabel").extend(Label);
  CharLabel.defineStatic({

    Single : Class.create("CharLabel.Single").extend(CharLabel).define({
      initialize : function(ch) {
        this.ch = ch;
      },
      match : function(input) {
        return input.val() === this.ch;
      }
    }),

    Range : Class.create("CharLabel.Range").extend(CharLabel).define({
      initialize : function(first, end) {
        this.first = first;
        this.end = end;
      },
      match : function(input) {
        return input.val() >= this.first && input.val() <= this.end;
      }
    }),

    Include : Class.create("CharLabel.Include").extend(CharLabel).define({
      initialize : function(chars) {
        this.chars = chars;
      },
      match : function(input) {
        return this.chars.indexOf(input.val()) != -1;
      }
    }),

    Exclude : Class.create("CharLabel.Exclude").extend(CharLabel).define({
      initialize : function(chars) {
        this.chars = chars;
      },
      match : function(input) {
        return this.chars.indexOf(input.val()) == -1;
      }
    }),

    Or : Class.create("Charlabel.Or").extend(CharLabel).define({
      initialize : function() {
        this.labels = Array.prototype.slice.call(arguments);
      },
      match : function(input) {
        for ( var i = 0; i < this.labels.length; i++) {
          if (this.labels[i].match(input)) {
            return true;
          }
        }
        return false;
      }
    })
  });

  var Edge = Class.create("Edge").define({
    initialize : function(label, dest) {
      this.label = label;
      this.dest = dest;
    },
    tryTransition : function(input, session) {
      return this.label.match(input, session) ? this.dest : null;
    }
  });

  var State = Class.create("State").define({

    initialize : function(num, edges, obj) {
      this.num = num;
      this.edges = edges;
      this.obj = obj;
    },

    getAcceptedObject : function() {
      return this.obj || null;
    },

    isAcceptable : function() {
      return this.obj !== null && this.obj !== undefined;
    },

    isEdgeExists : function() {
      return this.edges !== null && this.edges !== undefined && this.edges.length !== 0;
    }
  });

  var DFA = Class.create("DFA").define({

    initialize : function() {
      this.start = null;
      this.states = {};
    },

    addStartState : function(state) {
      this.start = state;
      this.states[state.num] = state;
    },

    addState : function(state) {
      this.states[state.num] = state;
    },

    startNewTransition : function() {
      if (this.start === null) {
        throw "start state is not set";
      }
      return new Transition(this);
    }
  });

  var Transition = Class.create("Transition").define({

    initialize : function(dfa) {
      this.dfa = dfa;
      this.current = dfa.start;
      this.session = {};
    },

    transit : function(input) {
      if (this.current == null) {
        throw "this transition has already failed due to illegal structure of the dfa";
      }
      for ( var i = 0; i < this.current.edges.length; i++) {
        var edge = this.current.edges[i];
        var dest = edge.tryTransition(input, this.session);
        if (dest === null) {
          continue;
        }
        this.current = this.dfa.states[dest];
        if (this.current == null) {
          throw "destination state '" + dest + "' is not found";
        }
        return true;
      }
      return false;
    },

    isAcceptable : function() {
      return this.current.isAcceptable();
    },

    isEdgeExists : function() {
      return this.current.isEdgeExists();
    },

    getAcceptedObject : function() {
      if (!this.isAcceptable()) {
        throw "current is not an accept state";
      }
      return this.current.getAcceptedObject();
    }
  });

  var CharInputSequence = Class.create("CharInputSequence").define({

    initialize : function(str) {
      this.str = str;
      this.nextLexis = "";
      this.forwardingPointer = 0;
      this.enableUnget = false;
    },

    get : function() {
      if (!this.hasNext()) {
        return null;
      }
      var ch = this.str.charAt(this.forwardingPointer++);
      this.enableUnget = true;
      this.nextLexis += ch;
      return new CharInput(ch);
    },

    unget : function() {
      if (!this.enableUnget) {
        throw "call getc first";
      }
      this.enableUnget = false;
      this.forwardingPointer--;
      this.nextLexis = this.nextLexis.slice(0, this.nextLexis.length - 1);
    },

    findLexis : function() {
      this.enableUnget = false;
      var lexis = this.nextLexis;
      this.nextLexis = "";
      return lexis;
    },

    hasNext : function() {
      return this.forwardingPointer < this.str.length;
    }
  });

  var Token = Class.create("Token").define({
    initialize : function(lexis, obj) {
      this.lexis = lexis;
      this.obj = obj;
    }
  });

  var Parser = Class.create("Parser").define({

    initialize : function(dfa, input) {
      this.dfa = dfa;
      this.input = input;
      this.$next = null;
    },

    next : function() {
      if (this.hasNext()) {
        var tmp = this.$next;
        this.$next = null;
        return tmp;
      } else {
        return null;
      }
    },

    hasNext : function() {
      if (this.$next !== null) {
        return true;
      }
      if (!this.input.hasNext()) {
        return false;
      }
      var trans = this.dfa.startNewTransition();
      var ch;
      while ((ch = this.input.get()) !== null) {
        if (trans.transit(ch)) {
          continue;
        } else {
          if (trans.isAcceptable()) {
            this.input.unget();
            var lexis = this.input.findLexis();
            this.$next = new Token(lexis, trans.getAcceptedObject());
            return true;
          } else {
            throw "parse error. near '" + this.input.findLexis() + "'";
          }
        }
      }
      var lexis = this.input.findLexis();
      if (!trans.isAcceptable()) {
        throw "parse error. near '" + lexis + "'";
      }
      this.$next = new Token(lexis, trans.getAcceptedObject());
      return true;
    }
  });

  xfan.dfa = {
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
  };

})();
