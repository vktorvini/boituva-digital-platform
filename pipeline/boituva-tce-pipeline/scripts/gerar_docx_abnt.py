import os
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

def gerar_relatorio_completo():
    doc = Document()

    # Configuração ABNT (Arial 12)
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(12)

    # --- CAPA ---
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("PREFEITURA MUNICIPAL DE BOITUVA\nSECRETARIA DE GOVERNO")
    run.bold = True
    run.font.size = Pt(14)

    for _ in range(10): doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("PROJETO BOITUVA DIGITAL: COCKPIT DE INTELIGÊNCIA INTEGRADA\nRELATÓRIO TÉCNICO-EXECUTIVO DO ECOSSISTEMA")
    run.bold = True
    run.font.size = Pt(16)

    for _ in range(15): doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("BOITUVA - SP\n2024")
    run.bold = True

    doc.add_page_break()

    # --- 1. VISÃO GERAL DO SISTEMA ---
    doc.add_heading('1. PANORAMA GERAL DO SISTEMA', level=1)
    doc.add_paragraph(
        "A Plataforma Boituva Digital não é apenas um site de consulta, mas uma central de comando integrada. "
        "O sistema unifica dados financeiros, socioeconômicos e políticos em uma única interface moderna e responsiva."
    )
    
    img_home = r"C:\Users\Vktor\.gemini\antigravity\brain\1f7debb4-6670-47ea-b776-e2b4d8b2381d\home_overview_final_1778693444877.png"
    if os.path.exists(img_home):
        doc.add_picture(img_home, width=Inches(6))
        p = doc.add_paragraph("Figura 1: Dashboard Principal - Visão de Gestão Financeira e Fiscal")
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # --- 2. MÓDULO SOCIOECONÔMICO (IBGE) ---
    doc.add_heading('2. INTELIGÊNCIA SOCIOECONÔMICA (IBGE)', level=1)
    doc.add_paragraph(
        "A plataforma integra dados do IBGE para fornecer um diagnóstico territorial preciso. Isso permite ao secretário de governo "
        "planejar políticas públicas baseadas na demografia e economia real de Boituva."
    )
    
    img_ibge = r"C:\Users\Vktor\.gemini\antigravity\brain\1f7debb4-6670-47ea-b776-e2b4d8b2381d\ibge_indicators_final_1778693454831.png"
    if os.path.exists(img_ibge):
        doc.add_picture(img_ibge, width=Inches(6))
        p = doc.add_paragraph("Figura 2: Indicadores Socioeconômicos e Territoriais")
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # --- 3. EFICIÊNCIA DE GESTÃO (IEGM) ---
    doc.add_heading('3. EFETIVIDADE DA GESTÃO (ÍNDICE IEGM)', level=1)
    doc.add_paragraph(
        "O sistema monitora o IEGM (Índice de Efetividade da Gestão Municipal), fornecendo ao Prefeito um scorecard "
        "de como a prefeitura está sendo avaliada pelo Tribunal de Contas (TCE-SP)."
    )
    
    img_iegm = r"C:\Users\Vktor\.gemini\antigravity\brain\1f7debb4-6670-47ea-b776-e2b4d8b2381d\iegm_scorecard_final_1778693464590.png"
    if os.path.exists(img_iegm):
        doc.add_picture(img_iegm, width=Inches(6))
        p = doc.add_paragraph("Figura 3: Scorecard de Efetividade Perante o TCE-SP")
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # --- 4. INTELIGÊNCIA ELEITORAL E HISTÓRICA ---
    doc.add_heading('4. INTELIGÊNCIA ELEITORAL E HISTÓRICA', level=1)
    doc.add_paragraph(
        "Com a consolidação de 30 anos de dados, o módulo TSE permite analisar a trajetória política da cidade e a composição "
        "da Câmara Municipal em tempo real."
    )
    
    img_tse = r"C:\Users\Vktor\.gemini\antigravity\brain\1f7debb4-6670-47ea-b776-e2b4d8b2381d\eleitorado_tse_final_1778693509018.png"
    if os.path.exists(img_tse):
        doc.add_picture(img_tse, width=Inches(6))
        p = doc.add_paragraph("Figura 4: Histórico Eleitoral e Resultados da Câmara 2024")
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_page_break()
    
    # --- 5. CONCLUSÃO E FUTURO ---
    doc.add_heading('5. CONCLUSÃO E PRÓXIMOS PASSOS', level=1)
    doc.add_paragraph(
        "O projeto Boituva Digital está pronto para ser a espinha dorsal da transparência e inteligência do governo. "
        "A próxima fase envolve a integração com o PNCP e ferramentas de auditoria em tempo real."
    )

    file_name = "BOITUVA_DIGITAL_RELATORIO_COMPLETO.docx"
    doc.save(file_name)
    print(f"Sucesso! Relatório completo gerado: {file_name}")

if __name__ == "__main__":
    gerar_relatorio_completo()
