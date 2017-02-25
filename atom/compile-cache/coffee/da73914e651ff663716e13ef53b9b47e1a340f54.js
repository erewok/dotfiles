(function() {
  var _, escapeString, highlightSync, popScope, pushScope, updateScopeStack;

  _ = require('underscore-plus');

  escapeString = function(string) {
    return string.replace(/[&"'<> ]/g, function(match) {
      switch (match) {
        case '&':
          return '&amp;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case ' ':
          return '&nbsp;';
        default:
          return match;
      }
    });
  };

  pushScope = function(scopeStack, scope, html) {
    scopeStack.push(scope);
    return html += "<span class=\"" + (scope.replace(/\.+/g, ' ')) + "\">";
  };

  popScope = function(scopeStack, html) {
    scopeStack.pop();
    return html += '</span>';
  };

  updateScopeStack = function(scopeStack, desiredScopes, html) {
    var excessScopes, i, j, k, l, ref, ref1, ref2;
    excessScopes = scopeStack.length - desiredScopes.length;
    if (excessScopes > 0) {
      while (excessScopes--) {
        html = popScope(scopeStack, html);
      }
    }
    for (i = k = ref = scopeStack.length; ref <= 0 ? k <= 0 : k >= 0; i = ref <= 0 ? ++k : --k) {
      if (_.isEqual(scopeStack.slice(0, i), desiredScopes.slice(0, i))) {
        break;
      }
      html = popScope(scopeStack, html);
    }
    for (j = l = ref1 = i, ref2 = desiredScopes.length; ref1 <= ref2 ? l < ref2 : l > ref2; j = ref1 <= ref2 ? ++l : --l) {
      html = pushScope(scopeStack, desiredScopes[j], html);
    }
    return html;
  };

  module.exports = highlightSync = function(arg) {
    var fileContents, grammar, html, k, l, lastLineTokens, len, len1, lineTokens, ref, ref1, registry, scopeName, scopeStack, scopes, tokens, value;
    ref = arg != null ? arg : {}, registry = ref.registry, fileContents = ref.fileContents, scopeName = ref.scopeName;
    grammar = registry.grammarForScopeName(scopeName);
    if (grammar == null) {
      return;
    }
    lineTokens = grammar.tokenizeLines(fileContents);
    if (lineTokens.length > 0) {
      lastLineTokens = lineTokens[lineTokens.length - 1];
      if (lastLineTokens.length === 1 && lastLineTokens[0].value === '') {
        lineTokens.pop();
      }
    }
    html = '';
    for (k = 0, len = lineTokens.length; k < len; k++) {
      tokens = lineTokens[k];
      scopeStack = [];
      for (l = 0, len1 = tokens.length; l < len1; l++) {
        ref1 = tokens[l], value = ref1.value, scopes = ref1.scopes;
        if (!value) {
          value = ' ';
        }
        html = updateScopeStack(scopeStack, scopes, html);
        html += "<span>" + (escapeString(value)) + "</span>";
      }
      while (scopeStack.length > 0) {
        html = popScope(scopeStack, html);
      }
      html += '\n';
    }
    return html;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvaGlnaGxpZ2h0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixZQUFBLEdBQWUsU0FBQyxNQUFEO1dBQ2IsTUFBTSxDQUFDLE9BQVAsQ0FBZSxXQUFmLEVBQTRCLFNBQUMsS0FBRDtBQUMxQixjQUFPLEtBQVA7QUFBQSxhQUNPLEdBRFA7aUJBQ2dCO0FBRGhCLGFBRU8sR0FGUDtpQkFFZ0I7QUFGaEIsYUFHTyxHQUhQO2lCQUdnQjtBQUhoQixhQUlPLEdBSlA7aUJBSWdCO0FBSmhCLGFBS08sR0FMUDtpQkFLZ0I7QUFMaEIsYUFNTyxHQU5QO2lCQU1nQjtBQU5oQjtpQkFPTztBQVBQO0lBRDBCLENBQTVCO0VBRGE7O0VBV2YsU0FBQSxHQUFZLFNBQUMsVUFBRCxFQUFhLEtBQWIsRUFBb0IsSUFBcEI7SUFDVixVQUFVLENBQUMsSUFBWCxDQUFnQixLQUFoQjtXQUNBLElBQUEsSUFBUSxnQkFBQSxHQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxFQUFzQixHQUF0QixDQUFELENBQWhCLEdBQTRDO0VBRjFDOztFQUlaLFFBQUEsR0FBVyxTQUFDLFVBQUQsRUFBYSxJQUFiO0lBQ1QsVUFBVSxDQUFDLEdBQVgsQ0FBQTtXQUNBLElBQUEsSUFBUTtFQUZDOztFQUlYLGdCQUFBLEdBQW1CLFNBQUMsVUFBRCxFQUFhLGFBQWIsRUFBNEIsSUFBNUI7QUFDakIsUUFBQTtJQUFBLFlBQUEsR0FBZSxVQUFVLENBQUMsTUFBWCxHQUFvQixhQUFhLENBQUM7SUFDakQsSUFBRyxZQUFBLEdBQWUsQ0FBbEI7QUFDb0MsYUFBTSxZQUFBLEVBQU47UUFBbEMsSUFBQSxHQUFPLFFBQUEsQ0FBUyxVQUFULEVBQXFCLElBQXJCO01BQTJCLENBRHBDOztBQUlBLFNBQVMscUZBQVQ7TUFDRSxJQUFTLENBQUMsQ0FBQyxPQUFGLENBQVUsVUFBVyxZQUFyQixFQUE2QixhQUFjLFlBQTNDLENBQVQ7QUFBQSxjQUFBOztNQUNBLElBQUEsR0FBTyxRQUFBLENBQVMsVUFBVCxFQUFxQixJQUFyQjtBQUZUO0FBS0EsU0FBUywrR0FBVDtNQUNFLElBQUEsR0FBTyxTQUFBLENBQVUsVUFBVixFQUFzQixhQUFjLENBQUEsQ0FBQSxDQUFwQyxFQUF3QyxJQUF4QztBQURUO1dBR0E7RUFkaUI7O0VBaUJuQixNQUFNLENBQUMsT0FBUCxHQUNBLGFBQUEsR0FBZ0IsU0FBQyxHQUFEO0FBRWQsUUFBQTt3QkFGZSxNQUFzQyxJQUFyQyx5QkFBVSxpQ0FBYztJQUV4QyxPQUFBLEdBQVUsUUFBUSxDQUFDLG1CQUFULENBQTZCLFNBQTdCO0lBQ1YsSUFBYyxlQUFkO0FBQUEsYUFBQTs7SUFFQSxVQUFBLEdBQWEsT0FBTyxDQUFDLGFBQVIsQ0FBc0IsWUFBdEI7SUFHYixJQUFHLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLENBQXZCO01BQ0UsY0FBQSxHQUFpQixVQUFXLENBQUEsVUFBVSxDQUFDLE1BQVgsR0FBb0IsQ0FBcEI7TUFFNUIsSUFBRyxjQUFjLENBQUMsTUFBZixLQUF5QixDQUF6QixJQUErQixjQUFlLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBbEIsS0FBMkIsRUFBN0Q7UUFDRSxVQUFVLENBQUMsR0FBWCxDQUFBLEVBREY7T0FIRjs7SUFPQSxJQUFBLEdBQU87QUFDUCxTQUFBLDRDQUFBOztNQUNFLFVBQUEsR0FBYTtBQUViLFdBQUEsMENBQUE7MEJBQUssb0JBQU87UUFDVixJQUFBLENBQW1CLEtBQW5CO1VBQUEsS0FBQSxHQUFRLElBQVI7O1FBQ0EsSUFBQSxHQUFPLGdCQUFBLENBQWlCLFVBQWpCLEVBQTZCLE1BQTdCLEVBQXFDLElBQXJDO1FBQ1AsSUFBQSxJQUFRLFFBQUEsR0FBUSxDQUFDLFlBQUEsQ0FBYSxLQUFiLENBQUQsQ0FBUixHQUE2QjtBQUh2QztBQUlrQyxhQUFNLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLENBQTFCO1FBQWxDLElBQUEsR0FBTyxRQUFBLENBQVMsVUFBVCxFQUFxQixJQUFyQjtNQUEyQjtNQUNsQyxJQUFBLElBQVE7QUFSVjtXQVVBO0VBMUJjO0FBdkNoQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbmVzY2FwZVN0cmluZyA9IChzdHJpbmcpIC0+XG4gIHN0cmluZy5yZXBsYWNlIC9bJlwiJzw+IF0vZywgKG1hdGNoKSAtPlxuICAgIHN3aXRjaCBtYXRjaFxuICAgICAgd2hlbiAnJicgdGhlbiAnJmFtcDsnXG4gICAgICB3aGVuICdcIicgdGhlbiAnJnF1b3Q7J1xuICAgICAgd2hlbiBcIidcIiB0aGVuICcmIzM5OydcbiAgICAgIHdoZW4gJzwnIHRoZW4gJyZsdDsnXG4gICAgICB3aGVuICc+JyB0aGVuICcmZ3Q7J1xuICAgICAgd2hlbiAnICcgdGhlbiAnJm5ic3A7J1xuICAgICAgZWxzZSBtYXRjaFxuXG5wdXNoU2NvcGUgPSAoc2NvcGVTdGFjaywgc2NvcGUsIGh0bWwpIC0+XG4gIHNjb3BlU3RhY2sucHVzaChzY29wZSlcbiAgaHRtbCArPSBcIjxzcGFuIGNsYXNzPVxcXCIje3Njb3BlLnJlcGxhY2UoL1xcLisvZywgJyAnKX1cXFwiPlwiXG5cbnBvcFNjb3BlID0gKHNjb3BlU3RhY2ssIGh0bWwpIC0+XG4gIHNjb3BlU3RhY2sucG9wKClcbiAgaHRtbCArPSAnPC9zcGFuPidcblxudXBkYXRlU2NvcGVTdGFjayA9IChzY29wZVN0YWNrLCBkZXNpcmVkU2NvcGVzLCBodG1sKSAtPlxuICBleGNlc3NTY29wZXMgPSBzY29wZVN0YWNrLmxlbmd0aCAtIGRlc2lyZWRTY29wZXMubGVuZ3RoXG4gIGlmIGV4Y2Vzc1Njb3BlcyA+IDBcbiAgICBodG1sID0gcG9wU2NvcGUoc2NvcGVTdGFjaywgaHRtbCkgd2hpbGUgZXhjZXNzU2NvcGVzLS1cblxuICAjIHBvcCB1bnRpbCBjb21tb24gcHJlZml4XG4gIGZvciBpIGluIFtzY29wZVN0YWNrLmxlbmd0aC4uMF1cbiAgICBicmVhayBpZiBfLmlzRXF1YWwoc2NvcGVTdGFja1swLi4uaV0sIGRlc2lyZWRTY29wZXNbMC4uLmldKVxuICAgIGh0bWwgPSBwb3BTY29wZShzY29wZVN0YWNrLCBodG1sKVxuXG4gICMgcHVzaCBvbiB0b3Agb2YgY29tbW9uIHByZWZpeCB1bnRpbCBzY29wZVN0YWNrIGlzIGRlc2lyZWRTY29wZXNcbiAgZm9yIGogaW4gW2kuLi5kZXNpcmVkU2NvcGVzLmxlbmd0aF1cbiAgICBodG1sID0gcHVzaFNjb3BlKHNjb3BlU3RhY2ssIGRlc2lyZWRTY29wZXNbal0sIGh0bWwpXG5cbiAgaHRtbFxuXG5cbm1vZHVsZS5leHBvcnRzID1cbmhpZ2hsaWdodFN5bmMgPSAoe3JlZ2lzdHJ5LCBmaWxlQ29udGVudHMsIHNjb3BlTmFtZX0gPSB7fSkgLT5cblxuICBncmFtbWFyID0gcmVnaXN0cnkuZ3JhbW1hckZvclNjb3BlTmFtZShzY29wZU5hbWUpXG4gIHJldHVybiB1bmxlc3MgZ3JhbW1hcj9cblxuICBsaW5lVG9rZW5zID0gZ3JhbW1hci50b2tlbml6ZUxpbmVzKGZpbGVDb250ZW50cylcblxuICAjIFJlbW92ZSB0cmFpbGluZyBuZXdsaW5lXG4gIGlmIGxpbmVUb2tlbnMubGVuZ3RoID4gMFxuICAgIGxhc3RMaW5lVG9rZW5zID0gbGluZVRva2Vuc1tsaW5lVG9rZW5zLmxlbmd0aCAtIDFdXG5cbiAgICBpZiBsYXN0TGluZVRva2Vucy5sZW5ndGggaXMgMSBhbmQgbGFzdExpbmVUb2tlbnNbMF0udmFsdWUgaXMgJydcbiAgICAgIGxpbmVUb2tlbnMucG9wKClcblxuICAjIGh0bWwgPSAnPGRpdiBjbGFzcz1cImVkaXRvciBlZGl0b3ItY29sb3JzXCI+J1xuICBodG1sID0gJydcbiAgZm9yIHRva2VucyBpbiBsaW5lVG9rZW5zXG4gICAgc2NvcGVTdGFjayA9IFtdXG4gICAgIyBodG1sICs9ICc8ZGl2IGNsYXNzPVwibGluZVwiPidcbiAgICBmb3Ige3ZhbHVlLCBzY29wZXN9IGluIHRva2Vuc1xuICAgICAgdmFsdWUgPSAnICcgdW5sZXNzIHZhbHVlXG4gICAgICBodG1sID0gdXBkYXRlU2NvcGVTdGFjayhzY29wZVN0YWNrLCBzY29wZXMsIGh0bWwpXG4gICAgICBodG1sICs9IFwiPHNwYW4+I3tlc2NhcGVTdHJpbmcodmFsdWUpfTwvc3Bhbj5cIlxuICAgIGh0bWwgPSBwb3BTY29wZShzY29wZVN0YWNrLCBodG1sKSB3aGlsZSBzY29wZVN0YWNrLmxlbmd0aCA+IDBcbiAgICBodG1sICs9ICdcXG4nXG4gICMgaHRtbCArPSAnPC9kaXY+J1xuICBodG1sXG4iXX0=
