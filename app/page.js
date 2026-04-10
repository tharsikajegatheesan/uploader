"use client";

import { useState } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  async function uploadSingleFile(file) {
    const presignResponse = await fetch("/api/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
      }),
    });

    if (!presignResponse.ok) {
      throw new Error(`Failed to request upload URL for ${file.name}`);
    }

    const { uploadUrl, key, bucket, region } = await presignResponse.json();

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${file.name} to S3`);
    }

    return {
      fileName: file.name,
      key,
      s3Uri: `s3://${bucket}/${key}`,
      objectUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
    };
  }

  async function handleUpload() {
    if (!files.length) return;

    setError("");
    setIsUploading(true);
    setResults([]);

    try {
      const uploaded = [];
      for (const file of files) {
        // Upload sequentially for predictable progress and simpler error handling.
        const result = await uploadSingleFile(file);
        uploaded.push(result);
      }
      setResults(uploaded);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <h1>Direct S3 Uploader</h1>
      <p>Select one or more files, then upload to your S3 bucket using pre-signed URLs.</p>

      <input
        type="file"
        multiple
        onChange={(event) => setFiles(Array.from(event.target.files || []))}
      />

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
        >
          {isUploading ? "Uploading..." : "Upload to S3"}
        </button>
      </div>

      {error ? (
        <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>
      ) : null}

      {results.length ? (
        <section style={{ marginTop: 20 }}>
          <h2>Uploaded Files</h2>
          <ul>
            {results.map((result) => (
              <li key={result.key}>
                <strong>{result.fileName}</strong>
                <div>{result.s3Uri}</div>
                <a href={result.objectUrl} target="_blank" rel="noreferrer">
                  Open object URL
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}