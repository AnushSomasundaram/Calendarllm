from PIL import Image, ImageDraw, ImageFont
import os

def create_calendar_icon(output_path, size=512):
    # Create a transparent image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dimensions
    padding = size // 8
    width = size - 2 * padding
    height = size - 2 * padding
    x0, y0 = padding, padding
    x1, y1 = x0 + width, y0 + height
    
    # Radius for rounded corners
    radius = size // 5

    # 1. Main White Body (The page)
    # Draw a rounded rectangle
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(255, 255, 255), outline=(200, 200, 200), width=2)
    
    # 2. Red Header
    header_height = height // 4
    
    # Draw full red shape
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(230, 60, 60))
    # Draw white body shifted down
    header_h = height // 3.5
    draw.rectangle([x0, y0 + header_h, x1, y1 - radius], fill=(255, 255, 255))
    draw.rounded_rectangle([x0, y0 + header_h, x1, y1], radius=radius, fill=(255, 255, 255))
    
    # 3. Spirals (Gray circles/ellipses at the top)
    num_spirals = 6
    spiral_y = y0 + header_h // 2
    spacing = width // (num_spirals + 1)
    
    for i in range(1, num_spirals + 1):
        cx = x0 + i * spacing
        cy = spiral_y
        r = size // 30
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(150, 150, 150), outline=(100,100,100), width=2)
        
        # Vertical wire
        draw.line([cx, y0 + 10, cx, cy], fill=(150, 150, 150), width=6)

    # 4. Content Lines
    line_x0 = x0 + size // 10
    line_x1 = x1 - size // 10
    start_y = y0 + header_h + size // 10
    line_gap = size // 10
    
    for i in range(3):
        y = start_y + i * line_gap
        draw.rectangle([line_x0, y, line_x1, y + 5], fill=(200, 200, 200))
        
        # Little checkmark on first line
        if i == 0:
             # Draw a green check/circle
             check_x = line_x1 - 40
             draw.ellipse([check_x, y-10, check_x+20, y+10], fill=(50, 200, 50))


    # Save
    if not os.path.exists(os.path.dirname(output_path)):
        os.makedirs(os.path.dirname(output_path))
    
    img.save(output_path)
    print(f"Icon generated at {output_path}")

if __name__ == "__main__":
    create_calendar_icon("build/icon.png")
