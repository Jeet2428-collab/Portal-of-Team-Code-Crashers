import threading
import json
import logging
import html
from django.core.mail import EmailMultiAlternatives, get_connection
from django.conf import settings
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

PORTAL_URL = "http://localhost:5173/notices"
PROJECTS_PORTAL_URL = "http://localhost:5173/projects"


def get_category_color(category):
    cat = (category or '').strip().lower()
    if 'event' in cat:
        return {'primary': '#a855f7', 'bg': '#2e1065', 'border': '#7e22ce', 'label': 'Event'}
    elif 'rules' in cat:
        return {'primary': '#f59e0b', 'bg': '#451a03', 'border': '#b45309', 'label': 'Rules & Regulations'}
    elif 'mentioned' in cat:
        return {'primary': '#f43f5e', 'bg': '#4c0519', 'border': '#be123c', 'label': 'Mentioned Member Only'}
    else:
        return {'primary': '#06b6d4', 'bg': '#083344', 'border': '#0e7490', 'label': 'Announcement'}


def get_priority_color(priority):
    pri = (priority or '').strip().lower()
    if pri in ['urgent', 'critical']:
        return {'primary': '#ef4444', 'bg': '#450a0a', 'border': '#b91c1c', 'label': 'URGENT'}
    elif pri == 'high':
        return {'primary': '#f59e0b', 'bg': '#451a03', 'border': '#b45309', 'label': 'HIGH PRIORITY'}
    elif pri == 'medium':
        return {'primary': '#38bdf8', 'bg': '#082f49', 'border': '#0284c7', 'label': 'MEDIUM'}
    else:
        return {'primary': '#94a3b8', 'bg': '#0f172a', 'border': '#334155', 'label': 'GENERAL'}


def build_notice_email_html(notice, recipient_user=None):
    cat_style = get_category_color(notice.category)
    pri_style = get_priority_color(notice.priority)

    # Format content with line breaks
    escaped_content = html.escape(notice.content).replace('\n', '<br />')
    escaped_title = html.escape(notice.title)
    escaped_author = html.escape(notice.author or 'Lead Administrator')
    escaped_audience = html.escape(notice.target_audience or 'All Members')
    date_str = notice.created_at.strftime('%B %d, %Y at %I:%M %p') if notice.created_at else 'Just now'
    recipient_name = recipient_user.first_name or recipient_user.username if recipient_user else 'Member'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{escaped_title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #082f49 100%); padding: 26px 30px; border-bottom: 1px solid #334155; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; font-family: monospace;">
                      OFFICIAL NOTICE CIRCULAR
                    </div>
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; margin-top: 4px; letter-spacing: 0.5px;">
                      CODE CRASHERS <span style="color: #06b6d4;">(TEAM CC)</span>
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="display: inline-block; background-color: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; border-radius: 10px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #67e8f9; font-family: monospace;">
                      LIVE NOTICE
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Badges Row -->
          <tr>
            <td style="padding: 24px 30px 10px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 8px;">
                    <span style="display: inline-block; background-color: {cat_style['bg']}; color: {cat_style['primary']}; border: 1px solid {cat_style['border']}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace;">
                      {cat_style['label']}
                    </span>
                  </td>
                  <td>
                    <span style="display: inline-block; background-color: {pri_style['bg']}; color: {pri_style['primary']}; border: 1px solid {pri_style['border']}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace;">
                      {pri_style['label']}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice Title -->
          <tr>
            <td style="padding: 10px 30px 15px 30px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.35; letter-spacing: -0.3px;">
                {escaped_title}
              </h1>
            </td>
          </tr>

          <!-- Metadata Box -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table role="presentation" width="100%" style="background-color: #030712; border: 1px solid #1e293b; border-radius: 12px; padding: 12px 16px;" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding: 3px 0;">
                    <strong style="color: #cbd5e1;">Issued By:</strong> {escaped_author}
                  </td>
                  <td align="right" style="font-size: 12px; color: #94a3b8; padding: 3px 0; font-family: monospace;">
                    {date_str}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="font-size: 12px; color: #94a3b8; padding: 4px 0 0 0; border-top: 1px dashed #1e293b; margin-top: 4px;">
                    <strong style="color: #cbd5e1;">Target Audience:</strong> <span style="color: #38bdf8;">{escaped_audience}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice Body / Content -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <div style="background-color: #0a1122; border-left: 3px solid {cat_style['primary']}; border-radius: 0 12px 12px 0; padding: 18px 20px; font-size: 14px; line-height: 1.7; color: #e2e8f0; word-break: break-word;">
                <p style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #94a3b8;">
                  Hello <strong style="color: #ffffff;">{html.escape(recipient_name)}</strong>,
                </p>
                {escaped_content}
              </div>
            </td>
          </tr>

          <!-- Call to Action Button -->
          <tr>
            <td align="center" style="padding: 0 30px 30px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);">
                    <a href="{PORTAL_URL}" target="_blank" style="font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; letter-spacing: 0.5px; border-radius: 10px;">
                      View Notice on Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 11px; color: #64748b; margin-top: 12px; margin-bottom: 0;">
                You can access and track all departmental notices directly from your member dashboard.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #030712; padding: 20px 30px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                This is an automated circular from the <strong>Code Crashers Official Portal</strong>.<br />
                Department of Computer Science & Engineering &bull; Code Crashers Hub<br />
                &copy; 2026 Team CC. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def build_notice_email_plain(notice, recipient_user=None):
    recipient_name = recipient_user.first_name or recipient_user.username if recipient_user else 'Member'
    date_str = notice.created_at.strftime('%B %d, %Y at %I:%M %p') if notice.created_at else 'Recent'

    return f"""================================================================
CODE CRASHERS (TEAM CC) - OFFICIAL NOTICE CIRCULAR
================================================================

Hello {recipient_name},

A new official notice has been published on the Code Crashers Portal.

----------------------------------------------------------------
NOTICE DETAILS
----------------------------------------------------------------
Title:           {notice.title}
Category:        {notice.category}
Priority:        {notice.priority}
Issued By:       {notice.author or 'Lead Administrator'}
Date & Time:     {date_str}
Target Audience: {notice.target_audience or 'All Members'}

----------------------------------------------------------------
NOTICE CONTENT
----------------------------------------------------------------
{notice.content}

----------------------------------------------------------------
Access this notice and other updates on the portal:
{PORTAL_URL}

--
Code Crashers Official Portal
Department of Computer Science & Engineering
Automated Notification System
"""


def get_notice_recipients(notice):
    """
    Returns a list of User objects who should receive the notice email.
    """
    recipients = []

    # If Mentioned Member only, parse mentioned_members
    if notice.category == 'Mentioned Member only' and notice.mentioned_members:
        try:
            parsed = json.loads(notice.mentioned_members)
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict):
                        # item can have email, id, member_id, name, username
                        email = item.get('email')
                        uid = item.get('id')
                        username = item.get('username')
                        member_id = item.get('member_id')

                        user = None
                        if uid:
                            user = User.objects.filter(id=uid, is_active=True).first()
                        if not user and email:
                            user = User.objects.filter(email__iexact=email, is_active=True).first()
                        if not user and username:
                            user = User.objects.filter(username__iexact=username, is_active=True).first()
                        if not user and member_id:
                            user = User.objects.filter(membership_card__member_id__iexact=member_id, is_active=True).first()

                        if user and user not in recipients:
                            recipients.append(user)
                    elif isinstance(item, (int, str)):
                        user = User.objects.filter(id=item, is_active=True).first() or \
                               User.objects.filter(username__iexact=str(item), is_active=True).first() or \
                               User.objects.filter(email__iexact=str(item), is_active=True).first()
                        if user and user not in recipients:
                            recipients.append(user)
        except Exception as e:
            logger.warning(f"Failed to parse mentioned_members JSON: {e}")

    # If general notice, or if no specific recipients parsed, send to all active registered members with emails
    if not recipients:
        recipients = list(User.objects.filter(is_active=True).exclude(email='').distinct())

    return recipients


def send_notice_broadcast_email(notice_id):
    """
    Worker function executed in background thread to dispatch notice emails.
    """
    from .models import NoticeSheet

    try:
        notice = NoticeSheet.objects.get(pk=notice_id)
    except NoticeSheet.DoesNotExist:
        logger.error(f"NoticeSheet with id {notice_id} does not exist for email dispatch.")
        return

    recipients = get_notice_recipients(notice)
    if not recipients:
        logger.info(f"No recipients found with email addresses for notice {notice_id}.")
        return

    subject = f"[Code Crashers | {notice.category}] {f'[{notice.priority}] ' if notice.priority else ''}{notice.title}"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)

    messages = []
    for user in recipients:
        if not user.email:
            continue

        html_body = build_notice_email_html(notice, recipient_user=user)
        plain_body = build_notice_email_plain(notice, recipient_user=user)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=from_email,
            to=[user.email]
        )
        msg.attach_alternative(html_body, "text/html")
        messages.append(msg)

    if not messages:
        return

    try:
        connection = get_connection(fail_silently=False)
        connection.open()
        sent_count = connection.send_messages(messages)
        connection.close()
        logger.info(f"Successfully dispatched {sent_count} notice emails for notice '{notice.title}' (ID: {notice_id}).")
    except Exception as e:
        logger.error(f"Error dispatching notice emails for notice {notice_id}: {e}", exc_info=True)


def dispatch_notice_email_async(notice_id):
    """
    Spawns background daemon thread to send notice emails without blocking HTTP response.
    """
    thread = threading.Thread(target=send_notice_broadcast_email, args=(notice_id,), daemon=True)
    thread.start()


def is_member_assigned_to_project(project, user):
    """
    Check if a given user is in the project's assigned_members JSON array.
    """
    if not user or not project.assigned_members:
        return False
    try:
        parsed = json.loads(project.assigned_members)
        if isinstance(parsed, list):
            user_mid = ''
            if hasattr(user, 'membership_card') and user.membership_card and user.membership_card.member_id:
                user_mid = str(user.membership_card.member_id).strip().upper()

            for item in parsed:
                if isinstance(item, dict):
                    item_id = str(item.get('id') or '').strip().upper()
                    item_mid = str(item.get('member_id') or '').strip().upper()
                    item_email = str(item.get('email') or '').strip().lower()
                    item_uname = str(item.get('username') or '').strip().lower()

                    if item_id and (item_id == str(user.id) or (user_mid and item_id == user_mid)):
                        return True
                    if item_mid and user_mid and item_mid == user_mid:
                        return True
                    if item_email and user.email and item_email == user.email.strip().lower():
                        return True
                    if item_uname and user.username and item_uname == user.username.strip().lower():
                        return True
                elif isinstance(item, (int, str)):
                    s = str(item).strip()
                    if s == str(user.id) or s.lower() == user.username.lower() or (user.email and s.lower() == user.email.lower()) or (user_mid and s.upper() == user_mid):
                        return True
    except Exception as e:
        logger.warning(f"Error checking project assignment for user {user}: {e}")
    return False


def get_project_recipients(project):
    """
    Returns ALL registered active users with email addresses.
    Every registered member receives the notification and email, with personalized
    content (Core Assigned Team Member vs Contributor Invitation).
    """
    return list(User.objects.filter(is_active=True).exclude(email='').distinct())


def build_project_email_html(project, recipient_user=None):
    escaped_title = html.escape(project.title)
    escaped_code = html.escape(project.code)
    escaped_desc = html.escape(project.description).replace('\n', '<br />')
    escaped_lead = html.escape(project.lead_name or 'Team Lead')
    escaped_cat = html.escape(project.category or 'Engineering')
    escaped_status = html.escape(project.status or 'In Progress')
    deadline_str = str(project.deadline) if project.deadline else 'Flexible / Ongoing'
    recipient_name = recipient_user.first_name or recipient_user.username if recipient_user else 'Member'

    is_assigned = is_member_assigned_to_project(project, recipient_user) if recipient_user else False

    if is_assigned:
        banner_tag = "CORE TEAM ASSIGNMENT"
        banner_color = "#34d399"
        header_grad = "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #065f46 100%)"
        greeting_html = f"""Hello <strong style="color: #ffffff;">{html.escape(recipient_name)}</strong>, you have been assigned as a <strong>Core Team Member</strong> on this initiative by Project Lead <span style="color: #38bdf8;">{escaped_lead}</span>."""
        cta_text = "Open Project Workspace &rarr;"
        cta_grad = "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
        role_badge = """<span style="display: inline-block; background-color: #064e3b; color: #34d399; border: 1px solid #059669; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace;">Role: Core Assigned</span>"""
        contribute_callout = """<p style="font-size: 11px; color: #94a3b8; margin-top: 12px; margin-bottom: 0;">You are designated as a core team member for sprint deliverables, resource uploads, and project reviews.</p>"""
    else:
        banner_tag = "NEW PROJECT INITIATIVE &bull; CALL FOR CONTRIBUTORS"
        banner_color = "#38bdf8"
        header_grad = "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)"
        greeting_html = f"""Hello <strong style="color: #ffffff;">{html.escape(recipient_name)}</strong>, a new engineering project has been launched by Project Lead <span style="color: #38bdf8;">{escaped_lead}</span>. While the initial team is set, <strong>you have the opportunity to contribute and collaborate!</strong>"""
        cta_text = "Explore & Contribute to Project &rarr;"
        cta_grad = "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)"
        role_badge = """<span style="display: inline-block; background-color: #082f49; color: #38bdf8; border: 1px solid #0284c7; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace;">Opportunity: Contributor</span>"""
        contribute_callout = """<p style="font-size: 11px; color: #94a3b8; margin-top: 12px; margin-bottom: 0;">You have the choice to collaborate, submit code or resources, or join as a contributor directly from the project workspace.</p>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Project: [{escaped_code}] {escaped_title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: {header_grad}; padding: 26px 30px; border-bottom: 1px solid #334155; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: {banner_color}; text-transform: uppercase; font-family: monospace;">
                      {banner_tag}
                    </div>
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; margin-top: 4px; letter-spacing: 0.5px;">
                      CODE CRASHERS <span style="color: #38bdf8;">PROJECTS HUB</span>
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; border-radius: 10px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #bae6fd; font-family: monospace;">
                      {escaped_code}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Badges Row -->
          <tr>
            <td style="padding: 24px 30px 10px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 8px;">
                    {role_badge}
                  </td>
                  <td style="padding-right: 8px;">
                    <span style="display: inline-block; background-color: #082f49; color: #38bdf8; border: 1px solid #0284c7; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace;">
                      Domain: {escaped_cat}
                    </span>
                  </td>
                  <td>
                    <span style="display: inline-block; background-color: #2e1065; color: #c084fc; border: 1px solid #7e22ce; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace;">
                      Team: {project.members_count} Member(s)
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Project Title -->
          <tr>
            <td style="padding: 10px 30px 15px 30px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.35; letter-spacing: -0.3px;">
                {escaped_title}
              </h1>
            </td>
          </tr>

          <!-- Metadata Box -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table role="presentation" width="100%" style="background-color: #030712; border: 1px solid #1e293b; border-radius: 12px; padding: 12px 16px;" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding: 3px 0;">
                    <strong style="color: #cbd5e1;">Project Lead:</strong> <span style="color: #38bdf8;">{escaped_lead}</span>
                  </td>
                  <td align="right" style="font-size: 12px; color: #94a3b8; padding: 3px 0; font-family: monospace;">
                    <strong style="color: #cbd5e1;">Deadline:</strong> {deadline_str}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Description / Overview -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <div style="background-color: #0a1122; border-left: 3px solid {banner_color}; border-radius: 0 12px 12px 0; padding: 18px 20px; font-size: 14px; line-height: 1.7; color: #e2e8f0; word-break: break-word;">
                <p style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #94a3b8;">
                  {greeting_html}
                </p>
                {escaped_desc}
              </div>
            </td>
          </tr>

          <!-- Call to Action Button -->
          <tr>
            <td align="center" style="padding: 0 30px 30px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background: {cta_grad};">
                    <a href="{PROJECTS_PORTAL_URL}" target="_blank" style="font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; letter-spacing: 0.5px; border-radius: 10px;">
                      {cta_text}
                    </a>
                  </td>
                </tr>
              </table>
              {contribute_callout}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #030712; padding: 20px 30px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                This is an automated engineering circular from the <strong>Code Crashers Official Portal</strong>.<br />
                Department of Computer Science & Engineering &bull; Code Crashers Projects Hub<br />
                &copy; 2026 Team CC. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def build_project_email_plain(project, recipient_user=None):
    recipient_name = recipient_user.first_name or recipient_user.username if recipient_user else 'Member'
    is_assigned = is_member_assigned_to_project(project, recipient_user) if recipient_user else False

    if is_assigned:
        role_text = "You have been assigned as a Core Team Member on this initiative."
    else:
        role_text = "A new project has been announced. You are invited to explore the specs and contribute!"

    return f"""================================================================
CODE CRASHERS (TEAM CC) - NEW PROJECT ANNOUNCEMENT
================================================================

Hello {recipient_name},

{role_text}

----------------------------------------------------------------
PROJECT DETAILS
----------------------------------------------------------------
Project Code:    {project.code}
Title:           {project.title}
Domain/Category: {project.category}
Status:          {project.status}
Project Lead:    {project.lead_name or 'Team Lead'}
Team Size:       {project.members_count} Member(s)
Target Deadline: {project.deadline or 'Flexible / Ongoing'}

----------------------------------------------------------------
PROJECT DESCRIPTION
----------------------------------------------------------------
{project.description}

----------------------------------------------------------------
Access the project workspace, collaborate, or contribute:
{PROJECTS_PORTAL_URL}

--
Code Crashers Official Portal
Department of Computer Science & Engineering
Engineering Projects Hub
Automated Notification System
"""


def send_project_broadcast_email(project_id):
    """
    Worker function executed in background thread to dispatch project assignment emails.
    """
    from .models import Project

    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        logger.error(f"Project with id {project_id} does not exist for email dispatch.")
        return

    recipients = get_project_recipients(project)
    if not recipients:
        logger.info(f"No recipients found with email addresses for project {project_id}.")
        return

    subject = f"[Code Crashers | Project Assignment] [{project.code}] {project.title}"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)

    messages = []
    for user in recipients:
        if not user.email:
            continue

        html_body = build_project_email_html(project, recipient_user=user)
        plain_body = build_project_email_plain(project, recipient_user=user)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=from_email,
            to=[user.email]
        )
        msg.attach_alternative(html_body, "text/html")
        messages.append(msg)

    if not messages:
        return

    try:
        connection = get_connection(fail_silently=False)
        connection.open()
        sent_count = connection.send_messages(messages)
        connection.close()
        logger.info(f"Successfully dispatched {sent_count} project assignment emails for project '{project.title}' (ID: {project_id}).")
    except Exception as e:
        logger.error(f"Error dispatching project assignment emails for project {project_id}: {e}", exc_info=True)


def dispatch_project_email_async(project_id):
    """
    Spawns background daemon thread to send project assignment emails without blocking HTTP response.
    """
    thread = threading.Thread(target=send_project_broadcast_email, args=(project_id,), daemon=True)
    thread.start()
