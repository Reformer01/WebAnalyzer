import openai
import os
import json
from typing import Dict, Any, List
import re

class AIAnalyzer:
    def __init__(self):
        openai.api_key = os.getenv('OPENAI_API_KEY')
        self.client = openai.OpenAI(api_key=openai.api_key) if openai.api_key else None

    def is_enabled(self) -> bool:
        """Check if AI analysis is enabled."""
        return self.client is not None

    async def analyze_content(self, content: str, metadata: Dict[str, Any], links: Dict[str, Any], images: Dict[str, Any]) -> Dict[str, Any]:
        """Perform AI-powered content analysis."""
        if not self.is_enabled():
            return {"error": "AI analysis not configured"}

        try:
            # Prepare the analysis prompt
            prompt = self._create_analysis_prompt(content, metadata, links, images)

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a web content analyst. Provide detailed, structured analysis of web pages."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )

            analysis_result = response.choices[0].message.content

            # Parse and structure the AI response
            return self._parse_ai_response(analysis_result)

        except Exception as e:
            return {"error": f"AI analysis failed: {str(e)}"}

    def _create_analysis_prompt(self, content: str, metadata: Dict[str, Any], links: Dict[str, Any], images: Dict[str, Any]) -> str:
        """Create a comprehensive analysis prompt for the AI."""

        # Truncate content for API limits
        content_preview = content[:2000] + "..." if len(content) > 2000 else content

        return f"""
        Analyze this webpage content and provide a structured analysis:

        PAGE INFO:
        - Title: {metadata.get('title', 'Unknown')}
        - Language: {metadata.get('language', 'Unknown')}
        - Links: {links.get('total', 0)} total ({links.get('total_internal', 0)} internal, {links.get('total_external', 0)} external)
        - Images: {images.get('total', 0)} total ({images.get('with_alt', 0)} with alt text)

        CONTENT PREVIEW:
        {content_preview}

        Please provide analysis in the following JSON format:
        {{
            "summary": "Brief 2-3 sentence summary of the page content and purpose",
            "topics": ["main", "topics", "identified"],
            "sentiment": "positive|negative|neutral",
            "readability_score": 1-10,
            "key_insights": ["insight1", "insight2", "insight3"],
            "seo_suggestions": ["suggestion1", "suggestion2"],
            "content_quality": "high|medium|low",
            "target_audience": "description of likely target audience"
        }}

        Focus on actionable insights and be specific.
        """

    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse and validate AI response."""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                return {
                    "success": True,
                    "analysis": parsed,
                    "raw_response": response
                }
            else:
                return {
                    "success": False,
                    "error": "Could not parse AI response as JSON",
                    "raw_response": response
                }
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": "Invalid JSON in AI response",
                "raw_response": response
            }

    def analyze_seo(self, metadata: Dict[str, Any], content: Dict[str, Any], headings: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze SEO aspects of the page."""
        seo_score = 0
        issues = []
        recommendations = []

        # Title analysis
        title = metadata.get('title', '')
        if not title:
            issues.append("Missing page title")
        elif len(title) < 30:
            issues.append("Title too short (should be 30-60 characters)")
            recommendations.append("Expand title to 30-60 characters for better SEO")
        elif len(title) > 60:
            issues.append("Title too long (should be 30-60 characters)")
            recommendations.append("Shorten title to under 60 characters")
        else:
            seo_score += 25

        # Meta description
        meta_desc = metadata.get('meta_tags', {}).get('description', '')
        if not meta_desc:
            issues.append("Missing meta description")
            recommendations.append("Add meta description (120-160 characters)")
        elif len(meta_desc) < 120:
            issues.append("Meta description too short")
            recommendations.append("Expand meta description to 120-160 characters")
        elif len(meta_desc) > 160:
            issues.append("Meta description too long")
            recommendations.append("Shorten meta description to under 160 characters")
        else:
            seo_score += 25

        # Heading structure
        h1_count = len(headings.get('h1', []))
        if h1_count == 0:
            issues.append("Missing H1 tag")
            recommendations.append("Add an H1 tag with your main keyword")
        elif h1_count > 1:
            issues.append("Multiple H1 tags found")
            recommendations.append("Use only one H1 tag per page")
        else:
            seo_score += 20

        # Content length
        content_length = content.get('length', 0)
        if content_length < 300:
            issues.append("Content too short for good SEO")
            recommendations.append("Add more content (aim for 300+ words)")
        else:
            seo_score += 15

        # Image alt text
        images = metadata.get('images', {})
        without_alt = images.get('without_alt', 0)
        if without_alt > 0:
            issues.append(f"{without_alt} images missing alt text")
            recommendations.append("Add descriptive alt text to all images")
            seo_score -= 10

        # Internal linking
        internal_links = metadata.get('links', {}).get('total_internal', 0)
        if internal_links < 3:
            recommendations.append("Add more internal links to improve site structure")
            seo_score += 5

        return {
            "score": max(0, seo_score),
            "grade": self._get_seo_grade(seo_score),
            "issues": issues,
            "recommendations": recommendations
        }

    def _get_seo_grade(self, score: int) -> str:
        """Convert SEO score to grade."""
        if score >= 80:
            return "A"
        elif score >= 70:
            return "B"
        elif score >= 60:
            return "C"
        elif score >= 50:
            return "D"
        else:
            return "F"
