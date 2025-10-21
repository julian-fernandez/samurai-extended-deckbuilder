import React, { useState, useEffect } from "react";
import { findCardImage } from "../services/imageService";
import jsPDF from "jspdf";

const DeckImageExport = ({ deck, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [allCards, setAllCards] = useState([]);

  // A4 dimensions in mm
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // Standard playing card dimensions
  const CARD_WIDTH_MM = 63; // Standard playing card width
  const CARD_HEIGHT_MM = 88; // Standard playing card height

  // Calculate margins to center the 3x3 grid
  const GRID_WIDTH = CARD_WIDTH_MM * 3;
  const GRID_HEIGHT = CARD_HEIGHT_MM * 3;
  const MARGIN_X = (A4_WIDTH_MM - GRID_WIDTH) / 2;
  const MARGIN_Y = (A4_HEIGHT_MM - GRID_HEIGHT) / 2;

  // Grid layout
  const CARDS_PER_ROW = 3;
  const CARDS_PER_COL = 3;
  const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

  useEffect(() => {
    const loadAllCards = async () => {
      const cards = [];

      // The deck is a flat array of cards with quantities
      if (deck && deck.length > 0) {
        for (const card of deck) {
          // Add multiple copies if quantity > 1
          for (let i = 0; i < card.quantity; i++) {
            cards.push({
              ...card,
              copyNumber: i + 1,
              totalCopies: card.quantity,
            });
          }
        }
      }
      setAllCards(cards);
      setLoading(false);
    };

    loadAllCards();
  }, [deck]);

  const loadImageAsBase64 = (imagePath) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataURL);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imagePath;
    });
  };

  const generatePDF = async () => {
    setLoading(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const totalPages = Math.ceil(allCards.length / CARDS_PER_PAGE);

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const startIndex = pageIndex * CARDS_PER_PAGE;
        const endIndex = Math.min(startIndex + CARDS_PER_PAGE, allCards.length);
        const pageCards = allCards.slice(startIndex, endIndex);

        // Add cards to this page
        for (let cardIndex = 0; cardIndex < pageCards.length; cardIndex++) {
          const card = pageCards[cardIndex];
          const row = Math.floor(cardIndex / CARDS_PER_ROW);
          const col = cardIndex % CARDS_PER_ROW;

          const x = MARGIN_X + col * CARD_WIDTH_MM;
          const y = MARGIN_Y + row * CARD_HEIGHT_MM;

          try {
            const imagePath = card.imagePath || findCardImage(card);
            if (imagePath) {
              const base64Image = await loadImageAsBase64(imagePath);
              pdf.addImage(
                base64Image,
                "JPEG",
                x,
                y,
                CARD_WIDTH_MM,
                CARD_HEIGHT_MM
              );
            } else {
              // Add placeholder for missing image
              pdf.setFillColor(240, 240, 240);
              pdf.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM, "F");
              pdf.setFontSize(8);
              pdf.setTextColor(100, 100, 100);
              pdf.text(card.name, x + 2, y + 10);
            }
          } catch (error) {
            console.warn(`Failed to load image for ${card.name}:`, error);
            // Add placeholder for failed image
            pdf.setFillColor(240, 240, 240);
            pdf.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM, "F");
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(card.name, x + 2, y + 10);
          }
        }
      }

      // Save the PDF
      pdf.save(`l5r-deck-export-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading card images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Deck Image Export</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            <p>
              Total cards: {allCards.length} | Pages:{" "}
              {Math.ceil(allCards.length / CARDS_PER_PAGE)}
            </p>
            <p>
              Card size: {CARD_WIDTH_MM}mm × {CARD_HEIGHT_MM}mm (standard
              playing card size)
            </p>
            <p>
              Margins: {MARGIN_X.toFixed(1)}mm horizontal, {MARGIN_Y.toFixed(1)}
              mm vertical
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={generatePDF}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Generating PDF..." : "Generate PDF"}
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">This will generate a PDF with:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>9 cards per A4 page (3×3 grid)</li>
              <li>No spacing between cards for easy cutting</li>
              <li>Standard playing card size (70mm × 99mm)</li>
              <li>All {allCards.length} cards from your deck</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckImageExport;
