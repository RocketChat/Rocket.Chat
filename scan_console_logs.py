import os
import re
import csv
from pathlib import Path

# Patterns to exclude
EXCLUDE_PATTERNS = [
    r'\.spec\.ts$',
    r'\.test\.ts$',
    r'__tests__/',
    r'test/',
    r'\.yarn/',
    r'node_modules/',
    r'\.github/',
    r'\.houston/',
    r'dist/',
    r'build/',
]

CONSOLE_PATTERN = r'console\.(log|warn|error|debug|info)\s*\('

def should_include_file(file_path):
    """Check if file should be included based on exclusion patterns"""
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, file_path):
            return False
    return file_path.endswith('.ts') and not file_path.endswith('.d.ts')

def get_priority(console_type, code_line):
    """Determine priority for removal"""
    # Development or temporary logging
    if any(x in code_line for x in ['development', 'debug', 'temporary', 'DEBUG', 'DEBUG_LEVEL', 'NODE_ENV']):
        return 'REMOVE'
    
    # Error logging - often important
    if console_type == 'error':
        return 'KEEP'
    
    # Warning logs - often important
    if console_type == 'warn' and any(x in code_line for x in ['deprecat', 'WARN', 'Error']):
        return 'KEEP'
    
    # Debug and verbose logging
    if console_type == 'debug':
        return 'REMOVE'
    
    # Info and log - depends on context
    if console_type in ['info', 'log']:
        if any(x in code_line for x in ['startup', 'initialized', 'created', 'successfully', 'Successfully']):
            return 'KEEP'
        if any(x in code_line for x in ['ufs:', 'LocalStore:', 'Database', 'connection']):
            return 'KEEP'
        return 'REVIEW'
    
    return 'REVIEW'

def extract_code_snippet(file_path, line_num):
    """Extract the exact code line"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            if 0 <= line_num - 1 < len(lines):
                return lines[line_num - 1].strip()
    except:
        pass
    return ''

def scan_directory():
    """Scan directory for console statements"""
    results = []
    
    for root, dirs, files in os.walk('.'):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if not any(re.search(p, os.path.join(root, d)) for p in EXCLUDE_PATTERNS)]
        
        for file in files:
            file_path = os.path.join(root, file).lstrip('.\\').lstrip('./')
            
            if not should_include_file(file_path):
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    for line_num, line in enumerate(f, 1):
                        match = re.search(CONSOLE_PATTERN, line)
                        if match:
                            console_type = match.group(1)
                            code_snippet = extract_code_snippet(file_path, line_num)
                            priority = get_priority(console_type, line + code_snippet)
                            
                            results.append({
                                'file_path': file_path,
                                'line_number': line_num,
                                'type': f'console.{console_type}',
                                'code_snippet': code_snippet,
                                'priority': priority
                            })
            except:
                pass
    
    return results

if __name__ == '__main__':
    print("Scanning repository for console statements...")
    results = scan_directory()
    
    print(f"Found {len(results)} console statements\n")
    
    # Group by priority for summary
    summary = {}
    for r in results:
        p = r['priority']
        summary[p] = summary.get(p, 0) + 1
    
    print("Summary by priority:")
    for priority, count in sorted(summary.items()):
        print(f"  {priority}: {count}")
    
    # Write to CSV
    output_file = 'CONSOLE_LOG_REMOVAL_ANALYSIS.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['file_path', 'line_number', 'type', 'code_snippet', 'priority'])
        writer.writeheader()
        writer.writerows(results)
    
    print(f"\nResults saved to {output_file}")
