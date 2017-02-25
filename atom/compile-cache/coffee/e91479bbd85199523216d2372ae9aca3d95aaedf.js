(function() {
  var Range, Validate, helpers;

  Range = require('atom').Range;

  helpers = require('./helpers');

  module.exports = Validate = {
    linter: function(linter, indie) {
      if (indie == null) {
        indie = false;
      }
      if (!indie) {
        if (!(linter.grammarScopes instanceof Array)) {
          throw new Error("grammarScopes is not an Array. Got: " + linter.grammarScopes);
        }
        if (linter.lint) {
          if (typeof linter.lint !== 'function') {
            throw new Error("linter.lint isn't a function on provider");
          }
        } else {
          throw new Error('Missing linter.lint on provider');
        }
        if (linter.scope && typeof linter.scope === 'string') {
          linter.scope = linter.scope.toLowerCase();
        }
        if (linter.scope !== 'file' && linter.scope !== 'project') {
          throw new Error('Linter.scope must be either `file` or `project`');
        }
      }
      if (linter.name) {
        if (typeof linter.name !== 'string') {
          throw new Error('Linter.name must be a string');
        }
      } else {
        linter.name = null;
      }
      return true;
    },
    messages: function(messages, linter) {
      if (!(messages instanceof Array)) {
        throw new Error("Expected messages to be array, provided: " + (typeof messages));
      }
      if (!linter) {
        throw new Error('No linter provided');
      }
      messages.forEach(function(result) {
        if (result.type) {
          if (typeof result.type !== 'string') {
            throw new Error('Invalid type field on Linter Response');
          }
        } else {
          throw new Error('Missing type field on Linter Response');
        }
        if (result.html) {
          if (typeof result.text === 'string') {
            throw new Error('Got both html and text fields on Linter Response, expecting only one');
          }
          if (typeof result.html !== 'string' && !(result.html instanceof HTMLElement)) {
            throw new Error('Invalid html field on Linter Response');
          }
          result.text = null;
        } else if (result.text) {
          if (typeof result.text !== 'string') {
            throw new Error('Invalid text field on Linter Response');
          }
          result.html = null;
        } else {
          throw new Error('Missing html/text field on Linter Response');
        }
        if (result.trace) {
          if (!(result.trace instanceof Array)) {
            throw new Error('Invalid trace field on Linter Response');
          }
        } else {
          result.trace = null;
        }
        if (result["class"]) {
          if (typeof result["class"] !== 'string') {
            throw new Error('Invalid class field on Linter Response');
          }
        } else {
          result["class"] = result.type.toLowerCase().replace(' ', '-');
        }
        if (result.filePath) {
          if (typeof result.filePath !== 'string') {
            throw new Error('Invalid filePath field on Linter response');
          }
        } else {
          result.filePath = null;
        }
        if (result.range != null) {
          result.range = Range.fromObject(result.range);
        }
        result.key = helpers.messageKey(result);
        result.linter = linter.name;
        if (result.trace && result.trace.length) {
          return Validate.messages(result.trace, linter);
        }
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL3ZhbGlkYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFDVixPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0VBRVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBQSxHQUNmO0lBQUEsTUFBQSxFQUFRLFNBQUMsTUFBRCxFQUFTLEtBQVQ7O1FBQVMsUUFBUTs7TUFDdkIsSUFBQSxDQUFPLEtBQVA7UUFDRSxJQUFBLENBQUEsQ0FBTyxNQUFNLENBQUMsYUFBUCxZQUFnQyxLQUF2QyxDQUFBO0FBQ0UsZ0JBQVUsSUFBQSxLQUFBLENBQU0sc0NBQUEsR0FBdUMsTUFBTSxDQUFDLGFBQXBELEVBRFo7O1FBRUEsSUFBRyxNQUFNLENBQUMsSUFBVjtVQUNFLElBQStELE9BQU8sTUFBTSxDQUFDLElBQWQsS0FBd0IsVUFBdkY7QUFBQSxrQkFBVSxJQUFBLEtBQUEsQ0FBTSwwQ0FBTixFQUFWO1dBREY7U0FBQSxNQUFBO0FBR0UsZ0JBQVUsSUFBQSxLQUFBLENBQU0saUNBQU4sRUFIWjs7UUFJQSxJQUFHLE1BQU0sQ0FBQyxLQUFQLElBQWlCLE9BQU8sTUFBTSxDQUFDLEtBQWQsS0FBdUIsUUFBM0M7VUFDRSxNQUFNLENBQUMsS0FBUCxHQUFlLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBYixDQUFBLEVBRGpCOztRQUVBLElBQXNFLE1BQU0sQ0FBQyxLQUFQLEtBQWtCLE1BQWxCLElBQTZCLE1BQU0sQ0FBQyxLQUFQLEtBQWtCLFNBQXJIO0FBQUEsZ0JBQVUsSUFBQSxLQUFBLENBQU0saURBQU4sRUFBVjtTQVRGOztNQVVBLElBQUcsTUFBTSxDQUFDLElBQVY7UUFDRSxJQUFtRCxPQUFPLE1BQU0sQ0FBQyxJQUFkLEtBQXdCLFFBQTNFO0FBQUEsZ0JBQVUsSUFB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SUFKUSxDQWpCVjs7QUFKRiIsInNvdXJjZXNDb250ZW50IjpbIntSYW5nZX0gPSByZXF1aXJlKCdhdG9tJylcbmhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRlID1cbiAgbGludGVyOiAobGludGVyLCBpbmRpZSA9IGZhbHNlKSAtPlxuICAgIHVubGVzcyBpbmRpZVxuICAgICAgdW5sZXNzIGxpbnRlci5ncmFtbWFyU2NvcGVzIGluc3RhbmNlb2YgQXJyYXlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZ3JhbW1hclNjb3BlcyBpcyBub3QgYW4gQXJyYXkuIEdvdDogI3tsaW50ZXIuZ3JhbW1hclNjb3Blc31cIilcbiAgICAgIGlmIGxpbnRlci5saW50XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImxpbnRlci5saW50IGlzbid0IGEgZnVuY3Rpb24gb24gcHJvdmlkZXJcIikgaWYgdHlwZW9mIGxpbnRlci5saW50IGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgbGludGVyLmxpbnQgb24gcHJvdmlkZXInKVxuICAgICAgaWYgbGludGVyLnNjb3BlIGFuZCB0eXBlb2YgbGludGVyLnNjb3BlIGlzICdzdHJpbmcnXG4gICAgICAgIGxpbnRlci5zY29wZSA9IGxpbnRlci5zY29wZS50b0xvd2VyQ2FzZSgpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpbnRlci5zY29wZSBtdXN0IGJlIGVpdGhlciBgZmlsZWAgb3IgYHByb2plY3RgJykgaWYgbGludGVyLnNjb3BlIGlzbnQgJ2ZpbGUnIGFuZCBsaW50ZXIuc2NvcGUgaXNudCAncHJvamVjdCdcbiAgICBpZiBsaW50ZXIubmFtZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMaW50ZXIubmFtZSBtdXN0IGJlIGEgc3RyaW5nJykgaWYgdHlwZW9mIGxpbnRlci5uYW1lIGlzbnQgJ3N0cmluZydcbiAgICBlbHNlXG4gICAgICBsaW50ZXIubmFtZSA9IG51bGxcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIG1lc3NhZ2VzOiAobWVzc2FnZXMsIGxpbnRlcikgLT5cbiAgICB1bmxlc3MgbWVzc2FnZXMgaW5zdGFuY2VvZiBBcnJheVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgbWVzc2FnZXMgdG8gYmUgYXJyYXksIHByb3ZpZGVkOiAje3R5cGVvZiBtZXNzYWdlc31cIilcbiAgICB0aHJvdyBuZXcgRXJyb3IgJ05vIGxpbnRlciBwcm92aWRlZCcgdW5sZXNzIGxpbnRlclxuICAgIG1lc3NhZ2VzLmZvckVhY2ggKHJlc3VsdCkgLT5cbiAgICAgIGlmIHJlc3VsdC50eXBlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciAnSW52YWxpZCB0eXBlIGZpZWxkIG9uIExpbnRlciBSZXNwb25zZScgaWYgdHlwZW9mIHJlc3VsdC50eXBlIGlzbnQgJ3N0cmluZydcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yICdNaXNzaW5nIHR5cGUgZmllbGQgb24gTGludGVyIFJlc3BvbnNlJ1xuICAgICAgaWYgcmVzdWx0Lmh0bWxcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yICdHb3QgYm90aCBodG1sIGFuZCB0ZXh0IGZpZWxkcyBvbiBMaW50ZXIgUmVzcG9uc2UsIGV4cGVjdGluZyBvbmx5IG9uZScgaWYgdHlwZW9mIHJlc3VsdC50ZXh0IGlzICdzdHJpbmcnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciAnSW52YWxpZCBodG1sIGZpZWxkIG9uIExpbnRlciBSZXNwb25zZScgaWYgdHlwZW9mIHJlc3VsdC5odG1sIGlzbnQgJ3N0cmluZycgYW5kIG5vdCAocmVzdWx0Lmh0bWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudClcbiAgICAgICAgcmVzdWx0LnRleHQgPSBudWxsXG4gICAgICBlbHNlIGlmIHJlc3VsdC50ZXh0XG4gICAgICAgIHRocm93IG5ldyBFcnJvciAnSW52YWxpZCB0ZXh0IGZpZWxkIG9uIExpbnRlciBSZXNwb25zZScgaWYgdHlwZW9mIHJlc3VsdC50ZXh0IGlzbnQgJ3N0cmluZydcbiAgICAgICAgcmVzdWx0Lmh0bWwgPSBudWxsXG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciAnTWlzc2luZyBodG1sL3RleHQgZmllbGQgb24gTGludGVyIFJlc3BvbnNlJ1xuICAgICAgaWYgcmVzdWx0LnRyYWNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciAnSW52YWxpZCB0cmFjZSBmaWVsZCBvbiBMaW50ZXIgUmVzcG9uc2UnIHVubGVzcyByZXN1bHQudHJhY2UgaW5zdGFuY2VvZiBBcnJheVxuICAgICAgZWxzZSByZXN1bHQudHJhY2UgPSBudWxsXG4gICAgICBpZiByZXN1bHQuY2xhc3NcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yICdJbnZhbGlkIGNsYXNzIGZpZWxkIG9uIExpbnRlciBSZXNwb25zZScgaWYgdHlwZW9mIHJlc3VsdC5jbGFzcyBpc250ICdzdHJpbmcnXG4gICAgICBlbHNlXG4gICAgICAgIHJlc3VsdC5jbGFzcyA9IHJlc3VsdC50eXBlLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnICcsICctJylcbiAgICAgIGlmIHJlc3VsdC5maWxlUGF0aFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZmlsZVBhdGggZmllbGQgb24gTGludGVyIHJlc3BvbnNlJykgaWYgdHlwZW9mIHJlc3VsdC5maWxlUGF0aCBpc250ICdzdHJpbmcnXG4gICAgICBlbHNlXG4gICAgICAgIHJlc3VsdC5maWxlUGF0aCA9IG51bGxcbiAgICAgIHJlc3VsdC5yYW5nZSA9IFJhbmdlLmZyb21PYmplY3QgcmVzdWx0LnJhbmdlIGlmIHJlc3VsdC5yYW5nZT9cbiAgICAgIHJlc3VsdC5rZXkgPSBoZWxwZXJzLm1lc3NhZ2VLZXkocmVzdWx0KVxuICAgICAgcmVzdWx0LmxpbnRlciA9IGxpbnRlci5uYW1lXG4gICAgICBWYWxpZGF0ZS5tZXNzYWdlcyhyZXN1bHQudHJhY2UsIGxpbnRlcikgaWYgcmVzdWx0LnRyYWNlIGFuZCByZXN1bHQudHJhY2UubGVuZ3RoXG4gICAgcmV0dXJuXG4iXX0=
