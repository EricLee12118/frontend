import os

def read_file_content(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"無法讀取文件: {str(e)}"

def scan_directory(path, indent=""):
    result = []
    
    # 獲取目錄下所有項目並排序
    items = os.listdir(path)
    items.sort()
    
    for item in items:
        full_path = os.path.join(path, item)
        
        # 忽略隱藏文件和特定文件夾
        if item.startswith('.') or item in ['__pycache__', 'venv', 'node_modules']:
            continue
            
        if os.path.isdir(full_path):
            result.append(f"\n{indent}📁 {item}/")
            result.extend(scan_directory(full_path, indent + "  "))
        else:
            # 檢查是否為代碼文件
            code_extensions = ['.py', '.js', '.java', '.cpp', '.c', '.html', '.css', '.php', '.rb', '.go', '.tsx', '.ts']
            if any(item.endswith(ext) for ext in code_extensions):
                result.append(f"{indent}📄 {item}")
                content = read_file_content(full_path)
                result.append(f"{indent}內容:\n{indent}```\n{content}\n{indent}```\n")
            else:
                result.append(f"{indent}📄 {item}")
    
    return result

def main():
    current_dir = os.getcwd()
    print(f"掃描目錄: {current_dir}")
    print("文件結構和代碼內容:")
    
    structure = scan_directory(current_dir)
    for line in structure:
        print(line)

if __name__ == "__main__":
    main()