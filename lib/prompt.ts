export const basePrompt = `
You are an expert UGC video script writer.
`;

export function generatePrompt(productDetails: string) {
    return `${basePrompt}\nProduct: ${productDetails}`;
}

export function generateBlocksPrompt(script: string) {
    return `Analyze the following UGC advertisement script and divide it into logical narrative blocks.
Each block should represent a meaningful part of the story.

Possible block types include:
- Hook
- Reaction
- Problem
- Product introduction
- Explanation
- Result
- Call to action

Return the result in JSON format exactly as follows:
{
  "blocks": [
    {
      "block_number": 1,
      "block_type": "Hook",
      "block_text": "..."
    }
  ]
}

CRITICAL: Do not invent text. You must only extract exact segments from the original script.

Script:
${script}`;
}

export function generateCreativesPrompt(blocks: any[]) {
    return `You are an expert UGC video script writer and strategist.
I have a video advertisement script that has been divided into the following logical narrative blocks:

${JSON.stringify(blocks, null, 2)}

Your task is to create 5 to 8 different creative variations for this advertisement.
Each variation must be based on proven advertising frameworks. You must use frameworks such as:
- Curiosity Hook
- Strong Problem Statement
- Emotional Reaction
- Transformation / Result
- Surprising Claim
- Testimonial Flow

CRITICAL OPENING STRATEGY INSTRUCTIONS to prioritize scroll-stopping openings:
1. Do not assume the first block is always the best opening.
2. Analyze all blocks and identify which ones could work as strong opening hooks (curiosity, strong problem, emotional reaction, surprising claim, transformation).
3. Generate creatives that start with different blocks when appropriate.
4. Avoid repeating the same starting block for most creatives.
5. Ensure the narrative still flows logically after the opening.
6. Prioritize testing different hook strategies rather than simply following the original script order.
The goal is to maximize scroll-stopping potential for ad creatives.

CRITICAL LANGUAGE & DIALECT INSTRUCTIONS FOR THE HOOK TITLE:
1. Detect the exact language and dialect of the input script automatically.
2. Generate the \`hook_title\` in the EXACT SAME language, dialect (e.g., Moroccan Darija, Gulf Khaleeji, Egyptian, etc.), and tone (casual, emotional, conversational) as the original script.
3. DO NOT translate the hook to Modern Standard Arabic (Fusha) or English unless the original script is explicitly written that way.
4. The hook must sound 100% natural and native to the script's original style and target audience. Keep it short, scroll-stopping, and highly conversational.

Return the result in JSON format exactly as follows:
{
  "creatives": [
    {
      "name": "Creative A",
      "framework": "Curiosity Hook",
      "hook_title": "A powerful scroll-stopping hook title that matches the first block of the creative.",
      "structure": [3, 1, 2, 4, 6, 7],
      "strategy_explanation": "Short explanation of why this structure works for the script, particularly focusing on why this new starting block is an effective hook.",
      "suggested_duration": "15–25 seconds",
      "scroll_stop_score": 9.1,
      "conversion_potential": "High",
      "emotional_trigger": "Curiosity and relief"
    }
  ]
}

CRITICAL STRUCTURE REQUIREMENTS:
- ONLY use the block_number values provided in the input for the "structure" array.
- Do not invent new blocks for the structure text.
- Ensure the hook_title is highly engaging, designed to stop scrolling, and perfectly aligned with the narrative of the first block in the "structure" array.`;
}
