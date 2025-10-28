from zai import ZhipuAiClient

client = ZhipuAiClient(api_key="your-api-key")

# 定义工具参数
tools = [{
    "type": "web_search",
    "web_search": {
        "enable": "True",
        "search_engine": "search_pro",
        "search_result": "True",
        "search_prompt": "你是一位财经分析师。请用简洁的语言总结网络搜索{search_result}中的关键信息，按重要性排序并引用来源日期。今天的日期是2025年4月11日。",
        "count": "5",
        "search_domain_filter": "www.sohu.com",
        "search_recency_filter": "noLimit",
        "content_size": "high"
    }
}]

# 定义用户消息
messages = [{
    "role": "user",
    "content": "2025年4月的重要财经事件、政策变化和市场数据"
}]

# 调用API获取响应
response = client.chat.completions.create(
    model="glm-4-air",  # 模型标识符
    messages=messages,  # 用户消息
    tools=tools         # 工具参数
)

# 打印响应结果
print(response)