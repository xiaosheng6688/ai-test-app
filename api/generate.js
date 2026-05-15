/**
 * Vercel Edge Function - AI 深度解读生成
 * 部署到 Vercel 后自动生效，免费额度：100K 次/月
 *
 * POST /api/generate
 * Body: { style: number, answers: number[], userName: string }
 * Response: { loveGuide, blindspot, advice, match }
 */

export const config = {
  runtime: 'edge',
};

const STYLE_NAMES = ['焦虑型', '安全型', '恐惧型', '回避型'];
const STYLE_DESC = [
  '你在亲密关系中极度渴望连接，需要大量的情感确认和安全感。你容易过度解读对方的每一个行为，有时会把正常的忙碌当作"不爱了"的信号。',
  '你在亲密关系中既能深度连接又能保持独立，情绪稳定，沟通顺畅。你是感情中的"安全基地"，既能爱人也能接受爱。',
  '你内心极度渴望亲密，但同时极度害怕受伤。你像一只刺猬，想靠近又退缩，这种矛盾让你在关系中经常进退两难。',
  '你高度重视独立和自由，在亲密关系中保持适度的距离感。你不习惯表达深层情感，更倾向于用行动而非言语表达爱意。'
];

export default async function handler(request) {
  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { style, answers } = await request.json();

    if (style === undefined || style < 0 || style > 3) {
      return new Response(JSON.stringify({ error: 'Invalid style' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const styleName = STYLE_NAMES[style];
    const styleDesc = STYLE_DESC[style];

    // 优先用环境变量里的 AI API KEY（用户自己填）
    // 没有的话用内置的免费模型兜底
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.QCLAW_AI_KEY || '';
    const hasApiKey = apiKey.length > 0;

    let aiResult = null;

    if (hasApiKey) {
      aiResult = await callDeepSeek(apiKey, styleName, styleDesc, answers);
    }

    // 兜底：API 挂了或用完了，返回高质量模板
    const result = aiResult || getFallbackResult(style);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Error in /api/generate:', err);
    // 出错也返回兜底内容，不让用户看到报错
    const style = 0;
    return new Response(JSON.stringify(getFallbackResult(style)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * 调用 DeepSeek API 生成个性化解读
 * DeepSeek 最便宜：¥0.001 / 1K tokens，一次生成约 ¥0.005
 */
async function callDeepSeek(apiKey, styleName, styleDesc, answers) {
  const prompt = `你是一位顶尖的亲密关系心理学家。请针对「${styleName}依恋人格」的用户，生成一份深度个性化恋爱分析报告。

用户的依恋模式描述：${styleDesc}
用户的答题模式（12题答案数组，0-3对应A-D）：${JSON.stringify(answers)}

请严格按以下格式输出 JSON（不要加任何 markdown 代码块标记）：

{
  "loveGuide": "150字以内的专属恋爱指南，语气亲切专业，给出具体可执行的建议",
  "blindspot": "100字以内的情感盲区预警，指出这种依恋类型最容易犯的错误",
  "advice": "3条具体的改善建议，每条以■开头，每条20-30字",
  "match": "20字以内，说明最匹配的依恋类型及原因"
}

要求：
- loveGuide 要具体到「下次吵架时你可以…」这种程度
- blindspot 要戳中痛点，让用户觉得「没错就是在说我」
- advice 要可操作，不是空话
- 整体语气：像一位懂你的心理咨询师，温柔但一针见血`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    console.error('DeepSeek API error:', response.status);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // 解析 JSON（兼容有无 ```json 包裹的情况）
  const jsonStr = content.replace(/^```json\s*|^```\s*|```$/gim, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error('Failed to parse DeepSeek response:', content);
    return null;
  }
}

/**
 * 兜底模板（API 不可用时的高质量静态内容）
 */
function getFallbackResult(style) {
  const fallbacks = [
    {
      loveGuide: '你需要的是一个能给你持续安全感的人。下次感到焦虑时，先深呼吸三次，然后直接告诉对方：「我现在需要你告诉我你爱我」，而不是生闷气。把安全感建立在自己身上——你值得被爱，即使对方正在开会没回消息。',
      blindspot: '你容易把对方的正常行为过度解读为「不爱了」的信号。当TA忙碌时，你的大脑会自动播放小剧场。学会区分「事实」和「恐惧」是你的必修课。',
      advice: '■ 延迟反应：感到焦虑时先等15分钟再行动，给理智回场的时间\n■ 直接表达：告诉伴侣「我需要你说爱我」而不是生闷气等对方猜\n■ 写情绪日记：记录触发焦虑的具体情境，你会发现自己有规律的触发点',
      match: '安全型依恋——TA的稳定会慢慢治愈你的焦虑，教你什么是「健康的爱」',
    },
    {
      loveGuide: '你的恋爱能力已经很强了，不需要补短板，而是发挥长板——用你的稳定去滋养关系。下次你的伴侣情绪崩溃时，不要急着给建议，先安静地陪TA，让TA感受到「我在」。',
      blindspot: '你的「太正常」有时会被误解为「不够爱」。焦虑型伴侣可能需要更热烈的情感表达。学会偶尔疯狂一下，让对方感受到你的热度，而不只是「理性的支持」。',
      advice: '■ 定期制造惊喜：让伴侣感受到你的在意，不只是稳定的陪伴\n■ 深度倾听：伴侣倾诉时，先共情再给建议，感受比解决方案更重要\n■ 保持开放：不要因为自己稳定就觉得对方的焦虑是「矫情」',
      match: '任何类型都能处好——你是关系中的「万能适配器」，稳定是你的超能力',
    },
    {
      loveGuide: '你的核心课题是「信任」。你不是不需要爱，而是太害怕受伤害。找一个愿意在你推开的第99次依然回来的人。但在此之前——你需要先对一个人说：「我决定相信你，即使可能会受伤」。',
      blindspot: '你会在关系变好的时候「搞破坏」——比如突然冷淡、找茬吵架。这不是因为你不爱了，而是你的潜意识在说「与其被伤害，不如我先离开」。识别这个模式是你的救命稻草。',
      advice: '■ 小步试探：给自己设定「信任梯度」，每次多相信一点点\n■ 表达恐惧：告诉伴侣「我现在很害怕」，而不是「你走吧」\n■ 寻求支持：恐惧型依恋往往有创伤根源，找一位好的心理咨询师',
      match: '安全型依恋——TA不会因为你推开就离开，会用耐心融化你的刺',
    },
    {
      loveGuide: '你的自由很重要，没问题。但如果有一天你遇到了一个让你愿意「不那么自由」的人，不要逃跑。下次你的伴侣需要你的时候，试着说「我在」，而不是消失。亲密不是牢笼，它可以是两个人的冒险。',
      blindspot: '你容易在对方需要你的时候「消失」。伴侣可能需要你更多的情感投入，而你本能地后退。这种拉扯会让对方觉得「TA根本不在乎我」，久而久之就会真的离开。',
      advice: '■ 练习表达：每周至少一次主动说「我想你」，三个字就够了\n■ 设定小目标：这周给伴侣一个惊喜，不用大，用心就行\n■ 理解差异：你的「没什么」可能是对方的「很受伤」，学会用对方的语言去爱',
      match: '焦虑型依恋——TA的热情能融化你的冷淡，你们是完美的互补',
    },
  ];
  return fallbacks[style] || fallbacks[0];
}
