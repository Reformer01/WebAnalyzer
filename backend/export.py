import pandas as pd
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import json
import os
from typing import Dict, Any
import tempfile

class ExportManager:
    def __init__(self):
        self.styles = getSampleStyleSheet()

    def export_to_pdf(self, analysis_result: Dict[str, Any], filename: str) -> str:
        """Export analysis to PDF format."""
        doc = SimpleDocTemplate(filename, pagesize=A4)
        story = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
        )
        story.append(Paragraph("Web Analysis Report", title_style))
        story.append(Spacer(1, 12))

        # Basic info
        story.append(Paragraph(f"<b>URL:</b> {analysis_result.get('url', 'N/A')}", self.styles['Normal']))
        story.append(Paragraph(f"<b>Title:</b> {analysis_result.get('title', 'N/A')}", self.styles['Normal']))
        story.append(Paragraph(f"<b>Analysis Date:</b> {analysis_result.get('timestamp', 'N/A')}", self.styles['Normal']))
        story.append(Spacer(1, 12))

        # Stats
        if 'stats' in analysis_result:
            stats = analysis_result['stats']
            stats_data = [
                ['Metric', 'Value'],
                ['Processing Time', f"{stats.get('processing_time', 0):.2f"}s"],
                ['Content Length', f"{stats.get('content_length', 0):,} characters"],
                ['Links Found', str(stats.get('link_count', 0))],
                ['Images Found', str(stats.get('image_count', 0))],
            ]

            stats_table = Table(stats_data)
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(stats_table)
            story.append(Spacer(1, 12))

        # Links section
        if 'links' in analysis_result and analysis_result['links'].get('all'):
            story.append(Paragraph("Links Analysis", self.styles['Heading2']))

            links_data = [['Text', 'URL', 'Type']]
            for link in analysis_result['links']['all'][:20]:  # Limit to 20 links
                links_data.append([
                    link.get('text', '')[:50],
                    link.get('href', ''),
                    'Internal' if link.get('is_internal') else 'External'
                ])

            links_table = Table(links_data)
            links_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(links_table)

        doc.build(story)
        return filename

    def export_to_csv(self, analysis_result: Dict[str, Any], filename: str) -> str:
        """Export analysis to CSV format."""
        data = []

        # Basic info
        data.append({
            'Type': 'Info',
            'Metric': 'URL',
            'Value': analysis_result.get('url', ''),
            'Details': ''
        })
        data.append({
            'Type': 'Info',
            'Metric': 'Title',
            'Value': analysis_result.get('title', ''),
            'Details': ''
        })
        data.append({
            'Type': 'Info',
            'Metric': 'Status Code',
            'Value': analysis_result.get('status_code', ''),
            'Details': ''
        })

        # Stats
        if 'stats' in analysis_result:
            stats = analysis_result['stats']
            data.append({
                'Type': 'Stats',
                'Metric': 'Processing Time',
                'Value': stats.get('processing_time', 0),
                'Details': 'seconds'
            })
            data.append({
                'Type': 'Stats',
                'Metric': 'Content Length',
                'Value': stats.get('content_length', 0),
                'Details': 'characters'
            })
            data.append({
                'Type': 'Stats',
                'Metric': 'Links Count',
                'Value': stats.get('link_count', 0),
                'Details': ''
            })
            data.append({
                'Type': 'Stats',
                'Metric': 'Images Count',
                'Value': stats.get('image_count', 0),
                'Details': ''
            })

        # Links
        if 'links' in analysis_result and analysis_result['links'].get('all'):
            for i, link in enumerate(analysis_result['links']['all']):
                data.append({
                    'Type': 'Link',
                    'Metric': f'Link {i+1}',
                    'Value': link.get('text', ''),
                    'Details': link.get('href', '')
                })

        # Images
        if 'images' in analysis_result and analysis_result['images'].get('images'):
            for i, img in enumerate(analysis_result['images']['images']):
                data.append({
                    'Type': 'Image',
                    'Metric': f'Image {i+1}',
                    'Value': img.get('alt', ''),
                    'Details': img.get('src', '')
                })

        df = pd.DataFrame(data)
        df.to_csv(filename, index=False)
        return filename

    def export_to_excel(self, analysis_result: Dict[str, Any], filename: str) -> str:
        """Export analysis to Excel format with multiple sheets."""
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # Overview sheet
            overview_data = {
                'Metric': ['URL', 'Title', 'Status Code', 'Analysis Date', 'Processing Time (s)', 'Content Length', 'Links Count', 'Images Count'],
                'Value': [
                    analysis_result.get('url', ''),
                    analysis_result.get('title', ''),
                    analysis_result.get('status_code', ''),
                    analysis_result.get('timestamp', ''),
                    analysis_result['stats'].get('processing_time', 0),
                    analysis_result['stats'].get('content_length', 0),
                    analysis_result['stats'].get('link_count', 0),
                    analysis_result['stats'].get('image_count', 0)
                ]
            }
            pd.DataFrame(overview_data).to_excel(writer, sheet_name='Overview', index=False)

            # Links sheet
            if 'links' in analysis_result and analysis_result['links'].get('all'):
                links_data = []
                for link in analysis_result['links']['all']:
                    links_data.append({
                        'Text': link.get('text', ''),
                        'URL': link.get('href', ''),
                        'Full URL': link.get('full_url', ''),
                        'Type': 'Internal' if link.get('is_internal') else 'External',
                        'Title': link.get('title', ''),
                        'Target': link.get('target', '')
                    })
                pd.DataFrame(links_data).to_excel(writer, sheet_name='Links', index=False)

            # Images sheet
            if 'images' in analysis_result and analysis_result['images'].get('images'):
                images_data = []
                for img in analysis_result['images']['images']:
                    images_data.append({
                        'Source': img.get('src', ''),
                        'Full URL': img.get('full_url', ''),
                        'Alt Text': img.get('alt', ''),
                        'Title': img.get('title', ''),
                        'Width': img.get('width', ''),
                        'Height': img.get('height', ''),
                        'Loading': img.get('loading', '')
                    })
                pd.DataFrame(images_data).to_excel(writer, sheet_name='Images', index=False)

            # Metadata sheet
            if 'metadata' in analysis_result:
                metadata = analysis_result['metadata']
                metadata_rows = []
                if 'meta_tags' in metadata:
                    for key, value in metadata['meta_tags'].items():
                        metadata_rows.append({'Type': 'Meta Tag', 'Name': key, 'Value': str(value)})
                if 'opengraph' in metadata:
                    for key, value in metadata['opengraph'].items():
                        metadata_rows.append({'Type': 'OpenGraph', 'Name': f'og:{key}', 'Value': str(value)})
                pd.DataFrame(metadata_rows).to_excel(writer, sheet_name='Metadata', index=False)

        return filename

    def export_to_json(self, analysis_result: Dict[str, Any], filename: str) -> str:
        """Export analysis to JSON format."""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(analysis_result, f, indent=2, ensure_ascii=False)
        return filename
