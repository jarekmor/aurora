#!/usr/bin/env python3
"""
Aurora Animation Generator
Downloads NOAA OVATION aurora forecast images and creates an animated GIF.

Usage:
    python aurora_animation.py [--fps 10] [--output aurora.gif] [--limit 50]
"""

import requests
import argparse
from pathlib import Path
from io import BytesIO
from datetime import datetime

try:
    from PIL import Image
except ImportError:
    print("PIL not found. Installing Pillow...")
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow", "--break-system-packages", "-q"])
    from PIL import Image


def fetch_aurora_data():
    """Fetch the aurora animation JSON from NOAA."""
    url = "https://services.swpc.noaa.gov/products/animations/ovation_north_24h.json"
    print(f"Fetching data from NOAA...")
    response = requests.get(url)
    response.raise_for_status()
    return response.json()


def download_image(url: str) -> Image.Image:
    """Download a single image and return as PIL Image."""
    response = requests.get(url)
    response.raise_for_status()
    return Image.open(BytesIO(response.content))


def create_animation(output_path: str = "aurora_animation.gif", fps: int = 10, limit: int = None):
    """
    Download aurora images and create an animated GIF.
    
    Args:
        output_path: Output filename (supports .gif and .webp)
        fps: Frames per second for the animation
        limit: Maximum number of frames to include (None for all)
    """
    base_url = "https://services.swpc.noaa.gov"
    
    # Fetch frame data
    frames_data = fetch_aurora_data()
    
    if limit:
        frames_data = frames_data[:limit]
    
    total_frames = len(frames_data)
    print(f"Found {total_frames} frames to process")
    
    # Download all images
    images = []
    for i, frame in enumerate(frames_data):
        img_url = base_url + frame["url"]
        time_tag = frame["time_tag"]
        
        print(f"Downloading frame {i+1}/{total_frames}: {time_tag}", end="\r")
        
        try:
            img = download_image(img_url)
            images.append(img)
        except Exception as e:
            print(f"\nWarning: Failed to download {img_url}: {e}")
            continue
    
    print(f"\nDownloaded {len(images)} images successfully")
    
    if not images:
        print("No images downloaded. Exiting.")
        return
    
    # Calculate duration in milliseconds
    duration = int(1000 / fps)
    
    # Save as GIF or WebP
    output_path = Path(output_path)
    print(f"Creating animation: {output_path}")
    
    if output_path.suffix.lower() == ".webp":
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            duration=duration,
            loop=0,
            quality=80
        )
    else:
        # GIF format
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            duration=duration,
            loop=0,
            optimize=True
        )
    
    file_size = output_path.stat().st_size / (1024 * 1024)
    print(f"Animation saved: {output_path} ({file_size:.1f} MB)")
    
    # Print time range
    start_time = frames_data[0]["time_tag"]
    end_time = frames_data[-1]["time_tag"]
    print(f"Time range: {start_time} to {end_time}")
    
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Download NOAA aurora forecast images and create an animation"
    )
    parser.add_argument(
        "--output", "-o",
        default="aurora_animation.gif",
        help="Output filename (.gif or .webp)"
    )
    parser.add_argument(
        "--fps", "-f",
        type=int,
        default=10,
        help="Frames per second (default: 10)"
    )
    parser.add_argument(
        "--limit", "-l",
        type=int,
        default=None,
        help="Limit number of frames (default: all ~288 frames)"
    )
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("NOAA Aurora Animation Generator")
    print("=" * 50)
    
    create_animation(
        output_path=args.output,
        fps=args.fps,
        limit=args.limit
    )


if __name__ == "__main__":
    main()
