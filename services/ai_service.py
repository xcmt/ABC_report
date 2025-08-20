import os
from openai import OpenAI, AuthenticationError, APIConnectionError
from .openai_service import get_openai_client

async def test_ai_connection():
    """
    测试与AI服务的连接和认证。
    """
    try:
        client = get_openai_client()
        client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo"),
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=5,
            n=1,
            temperature=0.1,
        )
        return {"status": "success", "message": "API配置有效，连接成功！"}
    except AuthenticationError as e:
        return {"status": "error", "message": f"API密钥无效或权限不足: {e.body.get('message') if e.body else '未知认证错误'}"}
    except APIConnectionError as e:
        return {"status": "error", "message": f"无法连接到API服务，请检查URL或网络: {e}"}
    except Exception as e:
        # 捕获其他可能的错误，例如模型不存在等
        return {"status": "error", "message": f"发生未知错误: {e}"}
