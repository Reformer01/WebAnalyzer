import redis
import json
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import os

class CacheManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        self.default_ttl = int(os.getenv('CACHE_TTL', 3600))  # 1 hour default

    def _generate_key(self, url: str, settings: Dict[str, Any]) -> str:
        """Generate a unique cache key for the analysis."""
        # Create a hash of URL and settings to ensure uniqueness
        key_data = f"{url}_{json.dumps(settings, sort_keys=True)}"
        return f"analysis:{hashlib.md5(key_data.encode()).hexdigest()}"

    def get(self, url: str, settings: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Retrieve cached analysis result."""
        try:
            key = self._generate_key(url, settings)
            cached_data = self.redis_client.get(key)

            if cached_data:
                data = json.loads(cached_data)
                # Check if cache is still valid
                if datetime.fromisoformat(data.get('cached_at', '')) + timedelta(seconds=self.default_ttl) > datetime.utcnow():
                    print(f"✅ Cache hit for {url}")
                    return data.get('result')
                else:
                    # Cache expired, delete it
                    self.redis_client.delete(key)
                    print(f"⏰ Cache expired for {url}")
            else:
                print(f"❌ Cache miss for {url}")
        except Exception as e:
            print(f"⚠️ Cache error: {e}")

        return None

    def set(self, url: str, settings: Dict[str, Any], result: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Store analysis result in cache."""
        try:
            key = self._generate_key(url, settings)
            cache_data = {
                'result': result,
                'cached_at': datetime.utcnow().isoformat()
            }

            ttl = ttl or self.default_ttl
            success = self.redis_client.setex(
                key,
                ttl,
                json.dumps(cache_data, default=str)
            )

            if success:
                print(f"💾 Cached result for {url} (TTL: {ttl}s)")
            return success
        except Exception as e:
            print(f"⚠️ Cache set error: {e}")
            return False

    def delete(self, url: str, settings: Dict[str, Any]) -> bool:
        """Delete specific cache entry."""
        try:
            key = self._generate_key(url, settings)
            return bool(self.redis_client.delete(key))
        except Exception as e:
            print(f"⚠️ Cache delete error: {e}")
            return False

    def clear_all(self) -> bool:
        """Clear all cache entries."""
        try:
            return bool(self.redis_client.flushdb())
        except Exception as e:
            print(f"⚠️ Cache clear error: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        try:
            info = self.redis_client.info()
            return {
                'keys': self.redis_client.dbsize(),
                'memory_used': info.get('used_memory_human', 'Unknown'),
                'hit_rate': info.get('keyspace_hits', 0) / (info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1))
            }
        except Exception as e:
            print(f"⚠️ Cache stats error: {e}")
            return {}
