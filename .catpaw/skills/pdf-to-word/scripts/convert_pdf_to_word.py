#!/usr/bin/env python3
"""
PDF 转 Word 文档转换器

将 PDF 文件转换为 Word (.docx) 格式，尽可能保留
布局、文本格式和图片。

使用方法:
    python convert_pdf_to_word.py <输入PDF> [输出docx]

依赖:
    pip install pdfplumber python-docx Pillow
"""

import sys
import os
from pathlib import Path

def check_dependencies():
    """检查所需的包是否已安装。"""
    missing = []
    try:
        import pdfplumber
    except ImportError:
        missing.append("pdfplumber")
    
    try:
        from docx import Document
    except ImportError:
        missing.append("python-docx")
    
    try:
        from PIL import Image
    except ImportError:
        missing.append("Pillow")
    
    if missing:
        print("错误: 缺少必要的依赖包:")
        for pkg in missing:
            print(f"  - {pkg}")
        print("\n请使用以下命令安装: pip install " + " ".join(missing))
        sys.exit(1)

def detect_heading(text, font_size, avg_font_size):
    """检测文本是否为标题。"""
    if font_size > avg_font_size * 1.5:
        return 1  # 一级标题
    elif font_size > avg_font_size * 1.2:
        return 2  # 二级标题
    elif font_size > avg_font_size * 1.1:
        return 3  # 三级标题
    return 0  # 正文

def convert_pdf_to_word(pdf_path, docx_path):
    """
    将 PDF 文件转换为 Word 文档。
    
    参数:
        pdf_path: 输入 PDF 文件的路径
        docx_path: 输出 Word 文档的路径
    """
    import pdfplumber
    from docx import Document
    from docx.shared import Pt, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from PIL import Image
    import io
    import tempfile
    
    # 验证输入
    if not os.path.exists(pdf_path):
        print(f"错误: 找不到 PDF 文件: {pdf_path}")
        sys.exit(1)
    
    print(f"正在转换: {pdf_path}")
    
    # 创建 Word 文档
    doc = Document()
    
    # 创建临时目录存放提取的图片
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                print(f"共 {total_pages} 页")
                
                # 收集所有字体大小以计算平均值
                all_font_sizes = []
                for page in pdf.pages:
                    chars = page.chars
                    for char in chars:
                        if 'size' in char:
                            all_font_sizes.append(char['size'])
                
                avg_font_size = sum(all_font_sizes) / len(all_font_sizes) if all_font_sizes else 12
                
                # 处理每一页
                for page_num, page in enumerate(pdf.pages, 1):
                    print(f"处理第 {page_num}/{total_pages} 页...")
                    
                    # 提取文本
                    text = page.extract_text()
                    
                    if text:
                        # 按段落分割
                        paragraphs = text.split('\n')
                        
                        for para_text in paragraphs:
                            para_text = para_text.strip()
                            if not para_text:
                                continue
                            
                            # 添加段落到文档
                            para = doc.add_paragraph(para_text)
                            
                            # 设置段落格式
                            para.paragraph_format.space_after = Pt(6)
                            para.paragraph_format.line_spacing = 1.15
                    
                    # 提取表格
                    tables = page.extract_tables()
                    if tables:
                        for table_data in tables:
                            if table_data:
                                # 创建表格
                                rows = len(table_data)
                                cols = len(table_data[0]) if table_data[0] else 0
                                
                                if rows > 0 and cols > 0:
                                    table = doc.add_table(rows=rows, cols=cols)
                                    table.style = 'Table Grid'
                                    
                                    for i, row_data in enumerate(table_data):
                                        for j, cell_data in enumerate(row_data):
                                            if cell_data:
                                                table.rows[i].cells[j].text = str(cell_data)
                                    
                                    # 表格后添加空行
                                    doc.add_paragraph()
                    
                    # 提取图片
                    images = []
                    if hasattr(page, 'images') and page.images:
                        for img in page.images:
                            try:
                                # 获取图片数据
                                img_obj = page.images[0] if isinstance(page.images, list) else img
                                
                                # 尝试获取图片流
                                if hasattr(img_obj, 'stream'):
                                    stream = img_obj['stream']
                                    img_data = stream.get_data()
                                else:
                                    continue
                                
                                # 转换为 PIL Image
                                pil_image = Image.open(io.BytesIO(img_data))
                                
                                # 保存临时文件
                                img_path = temp_path / f"page{page_num}_img{len(images)}.png"
                                pil_image.save(img_path, 'PNG')
                                
                                # 添加图片到文档
                                doc.add_picture(str(img_path), width=Inches(5))
                                doc.add_paragraph()  # 图片后添加空行
                                
                                print(f"  - 提取了 {len(images) + 1} 张图片")
                                
                            except Exception as e:
                                print(f"  警告: 无法提取图片: {e}")
                                continue
                    
                    # 页面之间添加分隔（除最后一页）
                    if page_num < total_pages:
                        doc.add_page_break()
        
        except Exception as e:
            print(f"转换过程中出错: {e}")
            sys.exit(1)
    
    # 保存文档
    doc.save(docx_path)
    print(f"\n转换完成!")
    print(f"输出文件: {docx_path}")

def main():
    """主函数。"""
    check_dependencies()
    
    if len(sys.argv) < 2:
        print("PDF 转 Word 文档转换器")
        print("\n使用方法:")
        print("  python convert_pdf_to_word.py <输入PDF> [输出docx]")
        print("\n示例:")
        print("  python convert_pdf_to_word.py document.pdf")
        print("  python convert_pdf_to_word.py document.pdf output.docx")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # 确定输出路径
    if len(sys.argv) >= 3:
        docx_path = sys.argv[2]
    else:
        # 使用相同的文件名，更改扩展名
        pdf_path_obj = Path(pdf_path)
        docx_path = str(pdf_path_obj.with_suffix('.docx'))
    
    convert_pdf_to_word(pdf_path, docx_path)

if __name__ == "__main__":
    main()
