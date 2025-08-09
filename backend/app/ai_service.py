import json
import asyncio
import aiohttp
from typing import Dict, List, Any, Optional
from .config import settings
import logging

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT
    
    async def check_ollama_health(self) -> bool:
        """ตรวจสอบว่า Ollama ทำงานอยู่หรือไม่"""
        try:
            async with aiohttp.ClientSession() as session:
                # ใช้ v1 API format สำหรับ health check
                async with session.get(f"{self.base_url}/v1/models", timeout=self.timeout) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False
    
    async def get_available_models(self) -> List[str]:
        """ดึงรายการ models ที่มีใน Ollama"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/v1/models", timeout=5) as response:
                    if response.status == 200:
                        result = await response.json()
                        models = []
                        for model in result.get("data", []):
                            model_id = model.get("id", "")
                            if model_id:  # เฉพาะ models ที่มีชื่อ
                                models.append(model_id)
                        logger.info(f"Found {len(models)} models in Ollama")
                        return sorted(models)  # เรียงตามตัวอักษร
                    else:
                        logger.error(f"Failed to get models: {response.status}")
                        return []
        except asyncio.TimeoutError:
            logger.error("Timeout getting models from Ollama")
            return []
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return []
    
    def set_model(self, model_name: str):
        """เปลี่ยน model ที่ใช้"""
        old_model = self.model
        self.model = model_name
        logger.info(f"Model changed from '{old_model}' to '{model_name}'")
    
    async def validate_model(self, model_name: str) -> bool:
        """ตรวจสอบว่า model มีอยู่จริงใน Ollama"""
        available_models = await self.get_available_models()
        return model_name in available_models
    
    async def generate_response(self, prompt: str, context: Optional[Dict] = None) -> str:
        """สร้างคำตอบจาก Ollama"""
        try:
            # สร้าง system prompt สำหรับ network topology analysis
            system_prompt = """คุณเป็นผู้เชี่ยวชาญด้านเครือข่ายคอมพิวเตอร์ ให้คำแนะนำเกี่ยวกับการออกแบบและวิเคราะห์แผนผังเครือข่าย 
            ให้คำตอบเป็นภาษาไทยที่เข้าใจง่าย และให้คำแนะนำที่เป็นประโยชน์"""

            # สร้าง full prompt
            full_prompt = f"{system_prompt}\n\nคำถาม: {prompt}"
            
            if context:
                full_prompt += f"\n\nข้อมูลแผนผังเครือข่าย: {json.dumps(context, ensure_ascii=False, indent=2)}"

            # ใช้ Ollama v1 chat completions API format
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ],
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 1000
                }
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/v1/chat/completions",
                    json=payload,
                    timeout=self.timeout
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get("choices", [{}])[0].get("message", {}).get("content", "ไม่สามารถสร้างคำตอบได้")
                    else:
                        error_text = await response.text()
                        logger.error(f"Ollama API error: {response.status} - {error_text}")
                        return f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI (Status: {response.status})"

        except asyncio.TimeoutError:
            logger.error("Ollama request timeout")
            return "การเชื่อมต่อกับ AI ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง"
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {str(e)}"

class NetworkTopologyAnalyzer:
    def __init__(self):
        self.ollama_service = OllamaService()
    
    def analyze_network_topology(self, nodes: List[Dict], edges: List[Dict]) -> Dict[str, Any]:
        """วิเคราะห์แผนผังเครือข่าย"""
        analysis = {
            "device_count": len(nodes),
            "connection_count": len(edges),
            "device_types": {},
            "potential_issues": [],
            "recommendations": []
        }
        
        # นับประเภทอุปกรณ์
        for node in nodes:
            device_type = node.get("type", "unknown")
            analysis["device_types"][device_type] = analysis["device_types"].get(device_type, 0) + 1
        
        # ตรวจสอบปัญหาที่อาจเกิดขึ้น
        if len(nodes) == 0:
            analysis["potential_issues"].append("ไม่มีอุปกรณ์ในแผนผังเครือข่าย")
        
        if len(edges) == 0 and len(nodes) > 1:
            analysis["potential_issues"].append("อุปกรณ์ไม่มีการเชื่อมต่อกัน")
        
        # ตรวจสอบการเชื่อมต่อที่ซ้ำซ้อน
        connections = set()
        for edge in edges:
            connection = tuple(sorted([edge.get("source"), edge.get("target")]))
            if connection in connections:
                analysis["potential_issues"].append("มีการเชื่อมต่อซ้ำซ้อน")
                break
            connections.add(connection)
        
        # ให้คำแนะนำพื้นฐาน
        if len(nodes) > 0:
            analysis["recommendations"].append("ตรวจสอบให้แน่ใจว่าอุปกรณ์ทั้งหมดมีการตั้งค่าที่เหมาะสม")
        
        if len(edges) > 0:
            analysis["recommendations"].append("ตรวจสอบ bandwidth และ latency ของการเชื่อมต่อ")
        
        return analysis
    
    async def get_ai_analysis(self, nodes: List[Dict], edges: List[Dict], user_question: str = "") -> str:
        """รับการวิเคราะห์จาก AI"""
        # ตรวจสอบ Ollama health
        if not await self.ollama_service.check_ollama_health():
            return "ไม่สามารถเชื่อมต่อกับ Ollama ได้ กรุณาตรวจสอบว่า Ollama ทำงานอยู่ที่ http://localhost:11434"
        
        # วิเคราะห์แผนผังเครือข่าย
        analysis = self.analyze_network_topology(nodes, edges)
        
        # สร้าง context สำหรับ AI
        context = {
            "analysis": analysis,
            "nodes": nodes,
            "edges": edges
        }
        
        # สร้าง prompt
        if user_question:
            prompt = f"วิเคราะห์แผนผังเครือข่ายนี้และตอบคำถาม: {user_question}"
        else:
            prompt = """วิเคราะห์แผนผังเครือข่ายนี้อย่างครอบคลุม โดยให้ข้อมูลในหัวข้อต่อไปนี้:

1. **ภาพรวมของเครือข่าย**: อธิบายโครงสร้างและองค์ประกอบหลัก
2. **การวิเคราะห์ประสิทธิภาพ**: ประเมินประสิทธิภาพและจุดคอขวด
3. **ความปลอดภัย**: ระบุจุดอ่อนและความเสี่ยงด้านความปลอดภัย
4. **คำแนะนำการปรับปรุง**: เสนอแนวทางการพัฒนาและปรับปรุง
5. **ข้อควรระวัง**: สิ่งที่ควรติดตามและดูแลรักษา

ให้คำตอบเป็นภาษาไทยที่เข้าใจง่าย พร้อมเหตุผลและตัวอย่างที่ชัดเจน"""
        
        # เรียกใช้ Ollama
        response = await self.ollama_service.generate_response(prompt, context)
        return response

# Global instance
analyzer = NetworkTopologyAnalyzer() 