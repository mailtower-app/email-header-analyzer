/**
 * Example header for the "Load example" button, all names and addresses are made up.
 */
export const exampleHeader = `Delivered-To: anna@example.org
Received: by 2002:a05:6402:1234:b0:123:4567:89ab with SMTP id x1csp123456;
        Tue, 24 Nov 2026 01:12:06 -0800 (PST)
Received: from mail-out.example.com (mail-out.example.com. [192.0.2.48])
        by mx.example.org with ESMTPS id a640c23a62f3a-abc123
        for <anna@example.org>
        (version=TLS1_3 cipher=TLS_AES_128_GCM_SHA256 bits=128/128);
        Tue, 24 Nov 2026 01:12:05 -0800 (PST)
Received: from app-server.example.com (app-server.example.com [198.51.100.7])
        by mail-out.example.com (Postfix) with ESMTPSA id 4F1A2B3C4D
        for <anna@example.org>; Tue, 24 Nov 2026 09:12:01 +0000 (UTC)
Return-Path: <billing@example.com>
Authentication-Results: mx.example.org;
       dkim=pass header.i=@example.com header.s=mail2026 header.b=AbCdEfGh;
       spf=pass (example.org: domain of billing@example.com designates 192.0.2.48 as permitted sender) smtp.mailfrom=billing@example.com;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=example.com
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=mail2026;
        h=from:to:subject:date:message-id;
        bh=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=;
        b=AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMnOpQrStUvWxYz0123456789
         AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMnOpQrStUvWxYz0123456789
From: =?UTF-8?Q?Example_Billing?= <billing@example.com>
To: Anna <anna@example.org>
Subject: =?UTF-8?Q?Your_invoice_for_November?=
Message-ID: <20261124091200.4F1A2B3C4D@example.com>
Date: Tue, 24 Nov 2026 09:12:00 +0000
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="000000000000a1b2c3"
X-Mailer: Example Mailer 4.2
List-Unsubscribe: <https://example.com/unsubscribe?id=123>
`;
