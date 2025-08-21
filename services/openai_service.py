import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(override=True)

def get_openai_client():
    """
    动态创建并返回一个OpenAI客户端实例。
    这确保了每次调用都能读取最新的环境变量。
    """
    return OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1"),
    )

def generate_vulnerability_details(vuln_name: str, max_retries=2):
    """
    使用 OpenAI GPT 模型生成漏洞描述和修复建议。
    增加了JSON解析和重试逻辑。
    """
    prompt = f"""
    针对以下漏洞，生成详细的描述和修复建议。

    漏洞名称: {vuln_name}

    你的任务是严格按照下面的JSON格式模板提供响应，不允许添加任何额外的说明、注释或Markdown代码标记。
    响应必须是一个可以直接通过JSON.parse()解析的纯粹的JSON对象。

    ```json
    {{
      "description": "这里是关于漏洞性质、原理、潜在影响和常见利用场景的详细描述。",
      "recommendation": "这里是具体、可操作的修复步骤或加固建议。"
    }}
    ```
    """
    
    client = get_openai_client()
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo"),
                messages=[
                    {"role": "system", "content": "你是一个API端点，专门用于根据用户输入生成结构化的JSON数据。你的输出必须严格遵守用户请求的JSON格式，不能包含任何解释性文字或非JSON内容。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1024,
                n=1,
                stop=None,
            )
            
            content = response.choices[0].message.content
            print("===== Raw AI Response =====")
            print(content)
            print("==========================")
            
            # 尝试清理和解析JSON
            # 有时AI可能会在JSON前后添加```json ```标记
            if content.strip().startswith("```json"):
                content = content.strip()[7:-3].strip()

            # 尝试解析JSON
            json.loads(content)
            return content

        except json.JSONDecodeError as e:
            print(f"Attempt {attempt + 1} failed: JSONDecodeError - {e}. Retrying...")
            if attempt + 1 == max_retries:
                print("Max retries reached. Failed to get valid JSON.")
                return None
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return None
            
    return None