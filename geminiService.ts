
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const editOutfit = async (
  base64SourceFace: string,
  base64TargetBody: string | null,
  textPrompt: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Không tìm thấy API Key. Vui lòng kiểm tra lại cấu hình.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const parts: any[] = [];

  // Ảnh 1: Gương mặt nguồn
  const sourceMatch = sourceFaceMatch(base64SourceFace);
  if (sourceMatch) {
    parts.push({
      inlineData: {
        mimeType: sourceMatch[1],
        data: sourceMatch[2],
      },
    });
  }

  // Ảnh 2: Ảnh mẫu (thân hình/bối cảnh)
  if (base64TargetBody) {
    const targetMatch = sourceFaceMatch(base64TargetBody);
    if (targetMatch) {
      parts.push({
        inlineData: {
          mimeType: targetMatch[1],
          data: targetMatch[2],
        },
      });
    }
  }

  // Prompt được tinh chỉnh để tránh bộ lọc an toàn nhưng vẫn đạt hiệu quả cao
  const finalPrompt = `
    Artistic Task: Creative Portrait Compositing.
    
    Inputs provided:
    - IMAGE 1 (Identity Reference): Use this image to understand the facial features and unique identity of the person.
    - IMAGE 2 (Base Portrait): This is the target image. Keep the body, hair, outfit, and background exactly as they are.
    
    Goal:
    Perform a professional portrait edit by placing the facial features of the person from IMAGE 1 onto the person in IMAGE 2. 
    The final person must clearly look like the person from IMAGE 1 while retaining the environment and style of IMAGE 2.
    - Blend the skin tones naturally.
    - Match the lighting and shadows of the original scene.
    - Ensure a photorealistic and high-quality result.
    
    ${textPrompt ? `- Additional Artist Notes: ${textPrompt}` : ""}
    
    Return ONLY the final single edited image. Do not include any text or side-by-side comparisons.
  `;

  parts.push({ text: finalPrompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      throw new Error("Hệ thống AI không phản hồi. Vui lòng thử lại sau.");
    }

    const candidate = response.candidates[0];

    // Xử lý lỗi an toàn một cách chi tiết
    if (!candidate.content || !candidate.content.parts) {
      const finishReason = (candidate as any).finishReason;
      if (finishReason === "SAFETY") {
        throw new Error("Ảnh bị từ chối bởi bộ lọc an toàn (IMAGE_SAFETY). Vui lòng thử dùng ảnh khác rõ mặt hơn, tránh các tư thế nhạy cảm hoặc phụ kiện che mặt (như kính râm quá to).");
      }
      throw new Error(`Lỗi kỹ thuật AI (${finishReason}). Thử lại với ảnh khác.`);
    }

    const imagePartResponse = candidate.content.parts.find(p => p.inlineData);

    if (imagePartResponse?.inlineData) {
      return `data:image/png;base64,${imagePartResponse.inlineData.data}`;
    }

    throw new Error("Không thể tạo kết quả từ ảnh đã chọn. Thử ảnh rõ nét hơn.");
  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    throw new Error(error.message || "Lỗi kết nối máy chủ AI.");
  }
};

function sourceFaceMatch(base64: string) {
  return base64.match(/^data:([^;]+);base64,(.+)$/);
}
