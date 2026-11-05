import re
import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def create_giro_docx():
    md_path = r"c:\Users\glauc\Desktop\Nova pasta\giro\docs\DOCUMENTACAO_TECNICA_COMPLETA_GIRO.md"
    docx_path = r"c:\Users\glauc\Desktop\Nova pasta\giro\docs\Especificacao_e_Documentacao_Tecnica_Giro_V1.docx"

    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    doc = Document()

    # Configurar margens
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Título Principal
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("ESPECIFICAÇÃO E DOCUMENTAÇÃO TÉCNICA COMPLETA\nGIRÔ v1.0")
    title_run.font.name = "Arial"
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(16, 185, 129) # Emerald

    subtitle_p = doc.add_paragraph()
    subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = subtitle_p.add_run("Sistema Inteligente de Gestão Orçamentária e Operacional para Motoristas de Aplicativo\nRecife - 2026\n")
    sub_run.font.name = "Arial"
    sub_run.font.size = Pt(12)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_page_break()

    in_table = False
    table_rows = []

    def flush_table():
        nonlocal in_table, table_rows
        if not table_rows:
            return
        
        # Filtra linhas separadoras do tipo |---|---|
        clean_rows = []
        for r in table_rows:
            cells = [c.strip() for c in r.strip().strip('|').split('|')]
            if cells and all(set(c).issubset({'-', ':', ' '}) for c in cells):
                continue
            clean_rows.append(cells)
        
        if clean_rows:
            num_cols = max(len(r) for r in clean_rows)
            t = doc.add_table(rows=len(clean_rows), cols=num_cols)
            t.alignment = WD_TABLE_ALIGNMENT.CENTER
            t.style = 'Light Shading Accent 1' if 'Light Shading Accent 1' in [s.name for s in doc.styles] else 'Table Grid'
            
            for row_idx, row_data in enumerate(clean_rows):
                for col_idx, cell_data in enumerate(row_data):
                    if col_idx < num_cols:
                        cell = t.cell(row_idx, col_idx)
                        cell.text = cell_data
                        p = cell.paragraphs[0]
                        p.runs[0].font.name = "Arial"
                        p.runs[0].font.size = Pt(9)
                        if row_idx == 0:
                            p.runs[0].font.bold = True
        
        table_rows = []
        in_table = False

    for line in lines:
        stripped = line.strip()
        
        # Tabelas Markdown
        if stripped.startswith('|') and stripped.endswith('|'):
            in_table = True
            table_rows.append(stripped)
            continue
        elif in_table:
            flush_table()

        if not stripped:
            continue

        # Cabeçalhos
        if stripped.startswith('# '):
            p = doc.add_paragraph()
            r = p.add_run(stripped[2:])
            r.font.name = "Arial"
            r.font.size = Pt(16)
            r.font.bold = True
            r.font.color.rgb = RGBColor(15, 23, 42)
        elif stripped.startswith('## '):
            p = doc.add_paragraph()
            r = p.add_run(stripped[3:])
            r.font.name = "Arial"
            r.font.size = Pt(14)
            r.font.bold = True
            r.font.color.rgb = RGBColor(16, 185, 129)
        elif stripped.startswith('### '):
            p = doc.add_paragraph()
            r = p.add_run(stripped[4:])
            r.font.name = "Arial"
            r.font.size = Pt(12)
            r.font.bold = True
            r.font.color.rgb = RGBColor(51, 65, 85)
        elif stripped.startswith('#### '):
            p = doc.add_paragraph()
            r = p.add_run(stripped[5:])
            r.font.name = "Arial"
            r.font.size = Pt(11)
            r.font.bold = True
        elif stripped.startswith('- ') or stripped.startswith('* '):
            p = doc.add_paragraph(style='List Bullet')
            # Limpa formatação básica de negrito **text**
            clean_text = re.sub(r'\*\*(.*?)\*\*', r'\1', stripped[2:])
            r = p.add_run(clean_text)
            r.font.name = "Arial"
            r.font.size = Pt(10)
        elif stripped.startswith('> '):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.5)
            r = p.add_run(stripped[2:])
            r.font.name = "Arial"
            r.font.size = Pt(10)
            r.font.italic = True
            r.font.color.rgb = RGBColor(71, 85, 105)
        elif stripped.startswith('```'):
            # Ignora fences de código simples
            continue
        else:
            p = doc.add_paragraph()
            clean_text = re.sub(r'\*\*(.*?)\*\*', r'\1', stripped)
            r = p.add_run(clean_text)
            r.font.name = "Arial"
            r.font.size = Pt(10)

    if in_table:
        flush_table()

    doc.save(docx_path)
    print(f"✅ Documento .docx gerado com sucesso em: {docx_path}")

if __name__ == "__main__":
    create_giro_docx()
