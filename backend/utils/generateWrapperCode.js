const generateWrapperCode = (language_id, solution, details) => {
  const { class_name, function_name } = details;

  switch (language_id) {
    // ----------------------------------------------------------------
    // JavaScript (Node.js) - Judge0 ID: 93
    // ----------------------------------------------------------------
    case 93:
      return `
// User's solution code is injected here
${solution}

// Generic Test Harness
((() => {
    const fs = require('fs');
    const stdin = fs.readFileSync(0, 'utf-8');
    
    let inputs;
    try {
        const raw = JSON.parse(stdin);
        // 1. Handle Double Encoding (Stringified JSON)
        if (typeof raw === 'string') {
            try {
                inputs = JSON.parse(raw);
            } catch (e) {
                inputs = raw;
            }
        } else {
            inputs = raw;
        }

        // 2. Ensure inputs is an array
        if (!Array.isArray(inputs)) {
            inputs = [inputs];
        }

        // 3. Handle "Function String" inputs like "sum(1, 2, 3)"
        if (inputs.length === 1 && typeof inputs[0] === 'string' && inputs[0].includes('(')) {
            const str = inputs[0];
            const argsString = str.substring(str.indexOf('(') + 1, str.lastIndexOf(')'));
            if (argsString.trim()) {
                try {
                    // Safe evaluation for JS arguments
                    inputs = eval("[" + argsString + "]");
                } catch (e) {
                    // Fallback
                }
            } else {
                inputs = [];
            }
        }

    } catch (err) {
        inputs = [];
    }

    let result;
    try {
        if ("${class_name}" && typeof ${class_name} !== 'undefined') {
            const solutionInstance = new ${class_name}();
            result = solutionInstance.${function_name}(...inputs);
        } else {
            result = ${function_name}(...inputs);
        }
        
        // Output handling
        if (typeof result === 'object' && result !== null) {
            console.log(JSON.stringify(result));
        } else {
            // This handles undefined/null/primitives
            console.log(result); 
        }
    } catch (err) {
        console.error(err);
    }
})());
      `;

    // ----------------------------------------------------------------
    // Python - Judge0 ID: 71
    // ----------------------------------------------------------------
    case 71:
      return `
import sys
import json
import ast

# User's solution code is injected here
${solution}

# Generic Test Harness
if __name__ == '__main__':
    try:
        line = sys.stdin.readline()
        if not line:
            inputs = []
        else:
            raw_input = json.loads(line)
            
            # 1. Handle Double Encoding
            if isinstance(raw_input, str):
                try:
                    inputs = json.loads(raw_input)
                except ValueError:
                    inputs = [raw_input]
            else:
                inputs = raw_input
        
        if not isinstance(inputs, list):
            inputs = [inputs]

        # 2. Handle "Function String" inputs like "sum(1, 2, 3)"
        if len(inputs) == 1 and isinstance(inputs[0], str) and '(' in inputs[0] and inputs[0].strip().endswith(')'):
            raw_str = inputs[0]
            start = raw_str.find('(') + 1
            end = raw_str.rfind(')')
            args_content = raw_str[start:end]
            
            if args_content.strip():
                try:
                    # Parse arguments safely using AST (handles None, numbers, strings)
                    parsed_args = ast.literal_eval(f"({args_content})")
                    inputs = list(parsed_args) if isinstance(parsed_args, tuple) else [parsed_args]
                except Exception:
                    pass 

        result = None
        
        # Execution Logic (Class vs Function)
        if '${class_name}' and '${class_name}' in locals():
            solution_instance = ${class_name}()
            func = getattr(solution_instance, '${function_name}')
            result = func(*inputs)
        elif '${function_name}' in locals():
            result = ${function_name}(*inputs)
        else:
            result = globals()['${function_name}'](*inputs)
                
        # ✅ FIX FOR TEST CASE 5/6: Handle None vs null
        if result is None:
            print("None") # Matches the expected string "None" in DB
        else:
            try:
                print(json.dumps(result))
            except:
                print(result)

    except Exception as e:
        sys.stderr.write(str(e))
        raise e
      `;

    // ----------------------------------------------------------------
    // Java - Judge0 ID: 62
    // ----------------------------------------------------------------
    case 62:
      const nonPublicSolution = solution.replace(/public class/g, "class");
      return `
import java.io.*;
import java.util.*;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

${nonPublicSolution}

public class Main {
    public static int[] toIntArray(List<Number> list) {
        return list.stream().mapToInt(Number::intValue).toArray();
    }

    public static List<Object> parseJsonArray(String json) {
        List<Object> result = new ArrayList<>();
        json = json.trim();
        if (!json.startsWith("[") || !json.endsWith("]")) return result;
        String content = json.substring(1, json.length() - 1).trim();
        if (content.isEmpty()) return result;

        int nestingLevel = 0;
        int lastSplit = 0;
        boolean inString = false;

        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            if (c == '"' && (i == 0 || content.charAt(i-1) != '\\\\')) {
                inString = !inString;
            }
            if (!inString) {
                if (c == '[' || c == '{') nestingLevel++;
                if (c == ']' || c == '}') nestingLevel--;
            }
            if (c == ',' && nestingLevel == 0 && !inString) {
                result.add(parseJsonValue(content.substring(lastSplit, i).trim()));
                lastSplit = i + 1;
            }
        }
        result.add(parseJsonValue(content.substring(lastSplit).trim()));
        return result;
    }

    public static Object parseJsonValue(String value) {
        if (value.equals("null")) return null;
        if (value.equals("true")) return true;
        if (value.equals("false")) return false;
        if (value.startsWith("\\\"") && value.endsWith("\\\"")) {
            return value.substring(1, value.length() - 1).replace("\\\\\\\"", "\\\"");
        }
        if (value.startsWith("[") && value.endsWith("]")) {
            List<Object> subList = parseJsonArray(value);
            boolean allNumbers = subList.stream().allMatch(o -> o instanceof Number);
            if(allNumbers && !subList.isEmpty()) {
                 return toIntArray((List<Number>)(List<?>)subList);
            }
            return subList;
        }
        try {
            if (value.contains(".")) return Double.parseDouble(value);
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            try { return Long.parseLong(value); } catch (NumberFormatException ex) { return value; }
        }
    }

    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null) return;

        List<Object> argsList = parseJsonArray(line);
        
        // 1. Double encoding check
        if (argsList.size() == 1 && argsList.get(0) instanceof String) {
            String inner = (String) argsList.get(0);
            if (inner.trim().startsWith("[") && inner.trim().endsWith("]")) {
                argsList = parseJsonArray(inner);
            } 
            // 2. Function String parsing for Java "sum(1, 2)"
            else if (inner.contains("(") && inner.endsWith(")")) {
                 String argsContent = inner.substring(inner.indexOf("(") + 1, inner.lastIndexOf(")"));
                 String[] parts = argsContent.split(",");
                 argsList.clear();
                 for(String p : parts) {
                     String trimP = p.trim();
                     try {
                        if(trimP.contains(".")) argsList.add(Double.parseDouble(trimP));
                        else argsList.add(Integer.parseInt(trimP));
                     } catch(Exception e) {
                        argsList.add(trimP.replace("'", "").replace("\"", ""));
                     }
                 }
            }
        }

        Object[] argsArray = argsList.toArray();
        
        try {
            Class<?> cls = Class.forName("${class_name}");
            
            Method toInvoke = null;
            for (Method m : cls.getDeclaredMethods()) {
                if (m.getName().equals("${function_name}") && m.getParameterCount() == argsArray.length) {
                    toInvoke = m;
                    break;
                }
            }
            
            if (toInvoke == null) {
                System.out.println("Error: Method not found"); 
                return;
            }

            toInvoke.setAccessible(true);
            Object instance = null;
            if (!Modifier.isStatic(toInvoke.getModifiers())) {
                instance = cls.getDeclaredConstructor().newInstance();
            }
            
            Object result = toInvoke.invoke(instance, argsArray);
            
            // Java specific formatting if needed
            System.out.println(result);
        } catch (Exception e) {
             System.out.println("Error: " + e.getMessage());
        }
    }
}
`;

    // C++ (Case 54) and others remain similar...
    case 54:
       return `
#include <iostream>
#include <string>
#include <vector>
#include "json.hpp"
using json = nlohmann::json;
${solution}
int main() { std::cout << "C++ requires specific types" << std::endl; return 0; }
       `;

    default:
      throw new Error(`Unsupported language ID: ${language_id}`);
  }
};

module.exports = { generateWrapperCode };