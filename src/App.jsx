import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef, useEffect, useState } from "react";
import "./styles.css";

export default function App() {
  const LIMIT = 50;
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreQuotes, setHasMoreQuotes] = useState({
    top: false,
    bottom: false,
  });
  // refs
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: quotes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  const fetchData = async (force = false) => {
    // whatever virtualization we are using we have to scroll to the last index after appending the list if implementing reverse infinite scrolling
    setIsLoading(true);
    const res = await fetch(
      `https://dummyjson.com/quotes?limit=50&skip=${quotes.length}`,
    );
    const data = await res.json();
    const newQuotes = data.quotes;
    // if first time return newQuotes else concate it
    const concatedQuotes = [...quotes, ...data.quotes];
    if (newQuotes.length === LIMIT) {
      setHasMoreQuotes({
        top: true,
        before: false,
      });
    } else {
      setHasMoreQuotes({
        top: false,
        before: false,
      });
    }
    setQuotes(force ? newQuotes : concatedQuotes);

    if (force) {
      // for the initial load scroll to bottom
      scrollRef.current = {
        index: newQuotes.length - 1,
        align: "end",
      };
    } else {
      // if reverse scrolling scroll to the last element
      scrollRef.current = {
        index: concatedQuotes.length - quotes.length,
        align: "top",
      };
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // for the first time api call we are passing a flag which helps us to
    // know that we has to scroll down to bottom
    fetchData(true);
    // the default behaviour of the div is scroll to  top if something is append on top
  }, []);

  // for scrolling
  useEffect(() => {
    if (quotes.length && scrollRef.current) {
      const { index, align } = scrollRef.current;
      rowVirtualizer.scrollToIndex(index, { align });
    }
  }, [quotes.length]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.id === "top" && hasMoreQuotes.top && !isLoading) {
            fetchData();
          } else if (
            entry.target.id === "bottom" &&
            hasMoreQuotes.bottom &&
            !isLoading
          ) {
            fetchData();
          }
        }
      });
    });

    if (topRef.current) {
      observer.observe(topRef.current);
    }
    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMoreQuotes, hasMoreQuotes.top, hasMoreQuotes.bottom, isLoading]);

  return (
    <div className="App">
      <div className="container">
        <div
          ref={parentRef}
          className="List"
          style={{
            height: `500px`,
            width: `500px`,
            overflow: "auto",
          }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            <div id="bottom" ref={bottomRef} />

            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                id={`item-${virtualRow.index}`}
                key={virtualRow.index}
                className={
                  virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven"
                }
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="list">{quotes[virtualRow.index].author}</div>
              </div>
            ))}
            <div id="top" ref={topRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
