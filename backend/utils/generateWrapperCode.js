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
    const stdin = require('fs').readFileSync(0, 'utf-8');
    const inputs = JSON.parse(JSON.parse(stdin));

    let result;
    if ("${class_name}") {
        const solutionInstance = new ${class_name}();
        result = solutionInstance.${function_name}(...inputs);
    } else {
        result = ${function_name}(...inputs);
    }
    
    if (typeof result === 'object' && result !== null) {
        console.log(JSON.stringify(result));
    } else {
        console.log(result);
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

# User's solution code is injected here
${solution}

# Generic Test Harness
if __name__ == '__main__':
    line = sys.stdin.readline()
    inputs = json.loads(json.loads(line))
    
    result = None
    if '${class_name}':
        solution_instance = ${class_name}()
        func = getattr(solution_instance, '${function_name}')
        result = func(*inputs)
    else:
        result = ${function_name}(*inputs)
        
    print(result)
      `;

    // ----------------------------------------------------------------
    // Java - Judge0 ID: 62 (Universal Wrapper)
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
    // Helper to convert a list of numbers to a primitive int array
    public static int[] toIntArray(List<Number> list) {
        return list.stream().mapToInt(Number::intValue).toArray();
    }

    // A simple, lightweight JSON array parser
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

    // Parses a single JSON value (string, number, boolean, array, null)
    public static Object parseJsonValue(String value) {
        if (value.equals("null")) return null;
        if (value.equals("true")) return true;
        if (value.equals("false")) return false;
        if (value.startsWith("\\\"") && value.endsWith("\\\"")) {
            return value.substring(1, value.length() - 1).replace("\\\\\\\"", "\\\"");
        }
        if (value.startsWith("[") && value.endsWith("]")) {
            List<Object> subList = parseJsonArray(value);
            // ✅ THE FIX IS HERE: The '!subList.isEmpty()' check was removed.
            boolean allNumbers = subList.stream().allMatch(o -> o instanceof Number);
            if(allNumbers) {
                 return toIntArray((List<Number>)(List<?>)subList);
            }
            return subList;
        }
        try {
            if (value.contains(".")) return Double.parseDouble(value);
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return value;
        }
    }

    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();

        List<Object> argsList = parseJsonArray(line);
        Object[] argsArray = argsList.toArray();
        
        Object result = null;
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
                throw new NoSuchMethodException("${class_name}.${function_name} with " + argsArray.length + " arguments");
            }

            toInvoke.setAccessible(true);
            
            Object instance = null;
            if (!Modifier.isStatic(toInvoke.getModifiers())) {
                instance = cls.getDeclaredConstructor().newInstance();
            }
            
            result = toInvoke.invoke(instance, argsArray);
        } catch (Exception e) {
             System.err.println("Error invoking method: " + e.getMessage());
             e.printStackTrace(System.err);
        }
        System.out.println(result);
    }
}
`;

    // ----------------------------------------------------------------
    // C++ - Judge0 ID: 54
    // ----------------------------------------------------------------
    case 54:
      return `
#include <iostream>
#include <string>
#include <vector>
#include "json.hpp"

using json = nlohmann::json;

// User's solution code is injected here
${solution}

int main() {
    std::string line;
    std::getline(std::cin, line);

    auto unescaped_json_str = json::parse(line).get<std::string>();
    auto inputs = json::parse(unescaped_json_str);

    std::string arg1 = inputs[0].get<std::string>();
    std::string arg2 = inputs[1].get<std::string>();

    Solution sol;
    auto result = sol.${function_name}(arg1, arg2);

    std::cout << result << std::endl;

    return 0;
}
      `;

    // Default case for unsupported languages
    default:
      throw new Error(`Unsupported language ID: ${language_id}`);
  }
};

module.exports = { generateWrapperCode };
