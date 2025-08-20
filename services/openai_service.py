import os
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

def generate_vulnerability_details(vuln_name: str):
    """
    使用 OpenAI GPT 模型生成漏洞描述和修复建议。
    """
    try:
        prompt = f"""
        请为以下漏洞生成详细的描述和修复建议。
        漏洞名称: {vuln_name}

        请以JSON格式返回，包含两个键: 'description' 和 'recommendation'。
        'description' 应详细说明该漏洞的性质、原理、潜在影响和常见利用场景。
        'recommendation' 应提供具体、可操作的修复步骤或加固建议。
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo"),
            messages=[
                {"role": "system", "content": "你是一个网络安全专家，擅长生成精确且专业的漏洞信息。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
            n=1,
            stop=None,
        )
        
        content = response.choices[0].message.content
        return content
    except Exception as e:
        print(f"Error generating vulnerability details with OpenAI: {e}")
        return None